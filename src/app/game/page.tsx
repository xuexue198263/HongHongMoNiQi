'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  type GameState,
  type Message,
  type ChatResponse,
  getAngerConfig,
  getAvatarTypeLabel,
  DIFFICULTY_LEVELS,
  PRESET_SCENES,
} from '@/lib/game-types';

export default function GamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [feedbackAnim, setFeedbackAnim] = useState<{ type: 'success' | 'fail'; value: number } | null>(null);
  const [showSceneIntro, setShowSceneIntro] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 加载游戏数据
  useEffect(() => {
    const data = sessionStorage.getItem('gameInitData');
    if (!data) {
      router.push('/');
      return;
    }
    try {
      const parsed = JSON.parse(data);
      const gs: GameState = {
        gender: parsed.gender,
        partnerName: parsed.partnerName,
        avatarType: parsed.avatarType,
        avatarUrl: parsed.avatarUrl,
        scene: parsed.scene,
        sceneId: parsed.sceneId,
        difficulty: parsed.difficulty || 'normal',
        angerValue: 100,
        round: 1,
        maxRounds: 10,
        usedRescue: false,
        messages: [parsed.initialMessage],
        status: 'playing',
      };
      setGameState(gs);
    } catch {
      router.push('/');
    }
  }, [router]);

  // 自动滚动
  useEffect(() => {
    if (!showSceneIntro) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.messages, showSceneIntro]);

  // 播放音效和动画
  const playFeedback = useCallback((angerChange: number) => {
    const type = angerChange <= 0 ? 'success' : 'fail';
    setFeedbackAnim({ type, value: angerChange });

    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch { /* ignore */ }

    setTimeout(() => setFeedbackAnim(null), 1500);
  }, []);

  // 发送选择
  const handleSend = useCallback(async (choice: string, isCustom: boolean) => {
    if (!gameState || isProcessing) return;
    setIsProcessing(true);
    setCustomInput('');

    try {
      const res = await fetch('/api/game/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameState,
          userChoice: choice,
          isCustomInput: isCustom,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || '发送失败');
        return;
      }
      const data: ChatResponse = await res.json();

      const userMsg: Message = { role: 'system', content: choice };
      const partnerMsg: Message = {
        role: 'partner',
        content: data.partnerMessage.content,
        options: data.partnerMessage.options,
        audioUrl: data.partnerMessage.audioUrl,
        angerChange: data.angerChange,
      };

      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          angerValue: data.newAngerValue,
          round: prev.round + 1,
          messages: [...prev.messages, userMsg, partnerMsg],
          status: data.gameStatus,
          usedRescue: data.usedRescue ?? prev.usedRescue,
          closingMessage: data.closingMessage,
        };
      });

      playFeedback(data.angerChange);

      if (data.gameOver) {
        setTimeout(() => {
          const resultData = {
            status: data.gameStatus,
            partnerName: gameState.partnerName,
            gender: gameState.gender,
            avatarType: gameState.avatarType,
            avatarUrl: gameState.avatarUrl,
            scene: gameState.scene,
            sceneId: gameState.sceneId,
            difficulty: gameState.difficulty,
            angerValue: data.newAngerValue,
            round: gameState.round,
            usedRescue: gameState.usedRescue,
            closingMessage: data.closingMessage,
          };
          sessionStorage.setItem('gameResultData', JSON.stringify(resultData));
          router.push('/result');
        }, 2500);
      }
    } catch {
      alert('网络错误，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [gameState, isProcessing, playFeedback, router]);

  // 播放语音
  const playAudio = useCallback(async (url: string, msgId: string) => {
    if (playingAudio === msgId) {
      audioRef.current?.pause();
      setPlayingAudio(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAudio(msgId);
    audio.onended = () => setPlayingAudio(null);
    audio.onerror = () => setPlayingAudio(null);
    try {
      await audio.play();
    } catch { /* ignore */ }
  }, [playingAudio]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  const angerConfig = getAngerConfig(gameState.angerValue);
  const currentOptions = gameState.messages[gameState.messages.length - 1]?.options;
  const genderLabel = gameState.gender === 'male' ? '男友' : '女友';
  const diffConfig = DIFFICULTY_LEVELS.find(d => d.id === gameState.difficulty);
  const sceneConfig = PRESET_SCENES.find(s => s.id === gameState.sceneId);

  // ====== 场景介绍全屏页 ======
  if (showSceneIntro) {
    return (
      <div className="min-h-screen bg-warm-cream flex flex-col items-center px-6 py-8">
        {/* 头像和名称 */}
        <div className="flex flex-col items-center mb-6 animate-fade-in">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-coral/20 shadow-lg mb-4">
            <Image
              src={gameState.avatarUrl || '/avatars/female_gentle.jpeg'}
              alt={gameState.partnerName}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold text-dark-gray">{gameState.partnerName}</h2>
          <p className="text-sm text-soft-gray mt-1">
            {genderLabel} · {getAvatarTypeLabel(gameState.avatarType, gameState.gender)}
          </p>
        </div>

        {/* 场景卡片 */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* 标签行 */}
          <div className="flex items-center gap-2 mb-4">
            {sceneConfig && (
              <span className="bg-coral/10 text-coral text-xs font-semibold px-2.5 py-1 rounded-full">
                {sceneConfig.name}
              </span>
            )}
            {diffConfig && (
              <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                {diffConfig.emoji} {diffConfig.label}
              </span>
            )}
          </div>

          {/* 场景标题 */}
          <h3 className="text-lg font-bold text-dark-gray mb-3">场景背景</h3>

          {/* 场景描述 */}
          <p className="text-sm text-dark-gray/80 leading-relaxed">
            {gameState.scene}
          </p>
        </div>

        {/* 愤怒值初始状态 */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-4 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-dark-gray">当前愤怒值</span>
            <span className="text-sm font-bold text-red-500">😡 100</span>
          </div>
          <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #2ED573, #FFA502, #FF6348, #FF4757)',
              }}
            />
          </div>
          <p className="text-xs text-soft-gray mt-2 text-center">
            在 10 轮内将愤怒值降到 0 即可哄好TA
          </p>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={() => setShowSceneIntro(false)}
          className="w-full max-w-md py-4 bg-coral text-white rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all animate-fade-in"
          style={{ animationDelay: '0.3s' }}
        >
          开始对话
        </button>
      </div>
    );
  }

  // ====== 聊天界面 ======
  return (
    <div className="min-h-screen bg-wechat-bg flex flex-col max-w-lg mx-auto">
      {/* 顶部栏 */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={gameState.avatarUrl || '/avatars/female_gentle.jpeg'}
            alt={gameState.partnerName}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-dark-gray text-sm">{gameState.partnerName}</div>
          <div className="text-xs text-soft-gray">{genderLabel} · {getAvatarTypeLabel(gameState.avatarType, gameState.gender)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-soft-gray">第 {gameState.round}/{gameState.maxRounds} 轮</div>
          <div className="text-sm font-bold" style={{ color: angerConfig.color }}>
            {angerConfig.emoji} {angerConfig.label} {gameState.angerValue}
          </div>
        </div>
      </div>

      {/* 愤怒值进度条 */}
      <div className="bg-white px-4 pb-2">
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${gameState.angerValue}%`,
              background: `linear-gradient(90deg, #2ED573, #FFA502, #FF6348, #FF4757)`,
            }}
          />
        </div>
      </div>

      {/* 反馈动画 */}
      {feedbackAnim && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${
          feedbackAnim.type === 'success' ? 'animate-success-feedback' : 'animate-fail-feedback'
        }`}>
          <div className={`text-6xl ${
            feedbackAnim.type === 'success' ? 'animate-bounce' : 'animate-shake'
          }`}>
            {feedbackAnim.type === 'success' ? '💚' : '💔'}
          </div>
          <div className={`absolute mt-20 text-2xl font-bold ${
            feedbackAnim.type === 'success' ? 'text-green-500' : 'text-red-500'
          }`}>
            {feedbackAnim.value > 0 ? `+${feedbackAnim.value}` : feedbackAnim.value}
          </div>
        </div>
      )}

      {/* 聊天区域 */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {gameState.messages.map((msg, idx) => {
          if (msg.role === 'system') {
            // 用户发送的消息
            return (
              <div key={idx} className="flex justify-end animate-fade-in">
                <div className="max-w-[75%] bg-coral text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm">
                  {msg.content}
                </div>
              </div>
            );
          }

          if (msg.role === 'rescue') {
            // 紧急挽救消息
            return (
              <div key={idx} className="flex justify-center">
                <div className="bg-amber-100 text-amber-800 rounded-full px-4 py-1.5 text-xs font-medium">
                  ⚠️ {msg.content}
                </div>
              </div>
            );
          }

          // 恋爱对象消息
          return (
            <div key={idx} className="flex gap-2 animate-fade-in">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1">
                <Image
                  src={gameState.avatarUrl || '/avatars/female_gentle.jpeg'}
                  alt={gameState.partnerName}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="max-w-[75%]">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-dark-gray leading-relaxed shadow-sm">
                  {msg.content}
                </div>
                {/* 语音播放条 - 珊瑚粉主题 */}
                {msg.audioUrl && (
                  <button
                    onClick={() => playAudio(msg.audioUrl!, `msg-${idx}`)}
                    className="mt-1.5 flex items-center gap-2.5 rounded-2xl px-4 py-2 shadow-sm transition-all active:scale-95"
                    style={{
                      background: playingAudio === `msg-${idx}`
                        ? 'linear-gradient(135deg, #FF6B6B, #FF8E8E)'
                        : 'linear-gradient(135deg, #FFF0F0, #FFE0E0)',
                    }}
                  >
                    <span className="text-base">
                      {playingAudio === `msg-${idx}` ? '🔊' : '🔈'}
                    </span>
                    <div className="flex gap-[3px] items-center h-4">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-[3px] rounded-full transition-all duration-300"
                          style={{
                            height: playingAudio === `msg-${idx}`
                              ? `${6 + Math.random() * 14}px`
                              : `${3 + (i % 3) * 3}px`,
                            backgroundColor: playingAudio === `msg-${idx}`
                              ? '#FF6B6B'
                              : '#FFB4B4',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs ml-1" style={{ color: '#FF6B6B' }}>
                      {Math.ceil(msg.content.length / 5)}&quot;
                    </span>
                  </button>
                )}
                {/* 愤怒值变化指示 */}
                {msg.angerChange !== undefined && msg.angerChange !== 0 && (
                  <div className={`text-xs mt-1 font-bold ${
                    msg.angerChange < 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {msg.angerChange < 0 ? `💚 ${Math.abs(msg.angerChange)}` : `💔 +${msg.angerChange}`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 选项区域 - 点击直接发送 */}
      {gameState.status === 'playing' && !isProcessing && (
        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-100 px-3 py-3 space-y-2">
          {currentOptions && currentOptions.length > 0 && currentOptions.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(opt, false)}
              disabled={isProcessing}
              className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all bg-gray-50 text-dark-gray hover:bg-coral/5 hover:border-coral/30 border border-gray-200 active:scale-[0.98] disabled:opacity-50"
            >
              {opt}
            </button>
          ))}

          {/* 自定义输入 */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && customInput.trim().length >= 2) {
                  e.preventDefault();
                  handleSend(customInput.trim(), true);
                }
              }}
              placeholder="自己说（回车发送）"
              maxLength={300}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-coral focus:outline-none text-sm bg-gray-50 text-dark-gray"
            />
            <button
              onClick={() => handleSend(customInput.trim(), true)}
              disabled={customInput.trim().length < 2 || customInput.trim().length > 300}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                customInput.trim().length >= 2 && customInput.trim().length <= 300
                  ? 'bg-coral text-white hover:scale-105 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              发送
            </button>
          </div>
        </div>
      )}

      {/* 处理中 */}
      {isProcessing && (
        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-6 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-sm text-soft-gray mt-2">{gameState.partnerName}正在思考...</p>
        </div>
      )}
    </div>
  );
}
