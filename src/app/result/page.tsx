'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import QRCode from 'qrcode';
import { type GameStatus, type AvatarType, getRatingLevel, getAvatarTypeLabel } from '@/lib/game-types';

interface ResultData {
  status: GameStatus;
  partnerName: string;
  avatarUrl: string;
  avatarType: AvatarType;
  gender: 'male' | 'female';
  rounds: number;
  round?: number; // 兼容旧字段名
  usedRescue: boolean;
  scene: string;
  angerValue: number;
  closingMessage?: string;
  closingAudioUrl?: string;
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ResultData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [shareCardUrl, setShareCardUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 游戏记录保存相关状态
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [recordSaved, setRecordSaved] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 加载结果数据
  useEffect(() => {
    const data = sessionStorage.getItem('gameResultData');
    if (!data) {
      router.push('/');
      return;
    }
    try {
      setResult(JSON.parse(data));
    } catch {
      router.push('/');
    }
  }, [router]);
  
  // 检查登录状态并保存游戏记录
  useEffect(() => {
    if (!result) return;
    
    const saveGameRecord = async () => {
      try {
        // 先检查登录状态
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        
        if (!authRes.ok || !authData.user) {
          // 未登录，显示登录提示弹窗
          setIsLoggedIn(false);
          setShowLoginPrompt(true);
          return;
        }
        
        setIsLoggedIn(true);
        
        // 已登录，保存游戏记录
        const effectiveRounds = result.rounds ?? result.round ?? 1;
        const finalScore = 100 - result.angerValue;
        const isWon = result.status === 'won';
        
        const saveRes = await fetch('/api/game/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: result.scene,
            partnerName: result.partnerName,
            finalScore: finalScore,
            result: isWon ? '通关' : '失败',
            rounds: effectiveRounds,
          }),
        });
        
        if (saveRes.ok) {
          setRecordSaved(true);
          
          // 通关时更新排行榜（分数越高越好）
          if (isWon) {
            await fetch('/api/leaderboard', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ score: finalScore }),
            });
          }
        } else {
          const saveData = await saveRes.json();
          setSaveError(saveData.error || '保存失败');
        }
      } catch {
        setSaveError('网络错误');
      }
    };
    
    saveGameRecord();
  }, [result]);

  // 生成二维码 + 分享卡片图片
  useEffect(() => {
    if (typeof window === 'undefined' || !result) return;
    const shareUrl = window.location.origin;

    QRCode.toDataURL(shareUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#2D3436', light: '#FFFFFF' },
    }).then((qrUrl) => {
      setQrDataUrl(qrUrl);
      // 自动生成分享卡片
      generateShareCard(result, qrUrl, shareUrl);
    }).catch(() => {});
  }, [result]);

  const generateShareCard = useCallback(async (res: ResultData, qrImgDataUrl: string, shareUrl: string) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 750;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 背景
      const gradient = ctx.createLinearGradient(0, 0, 0, 1200);
      if (res.status === 'won') {
        gradient.addColorStop(0, '#FFF8F0');
        gradient.addColorStop(1, '#FFE8E8');
      } else {
        gradient.addColorStop(0, '#FFF8F0');
        gradient.addColorStop(1, '#F0F0F0');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 750, 1200);

      // 顶部装饰条
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(0, 0, 750, 12);

      // 标题
      ctx.fillStyle = '#FF6B6B';
      ctx.font = 'bold 52px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('哄哄模拟器', 375, 100);

      // 结果
      const isWon = res.status === 'won';
      ctx.fillStyle = isWon ? '#2ED573' : '#FF4757';
      ctx.font = 'bold 76px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(isWon ? '哄哄成功！' : '哄哄失败', 375, 220);

      // 评价
      const effectiveRounds = res.rounds ?? res.round ?? 0;
      if (isWon) {
        const rating = getRatingLevel(effectiveRounds, res.usedRescue);
        ctx.fillStyle = '#2D3436';
        ctx.font = 'bold 42px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(`${rating.emoji} ${rating.title}`, 375, 310);
        ctx.fillStyle = '#636E72';
        ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(rating.description, 375, 360);
      }

      // 统计信息
      ctx.fillStyle = '#2D3436';
      ctx.font = '30px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(`对象：${res.partnerName}`, 375, 460);
      ctx.fillText(`用了 ${effectiveRounds} 轮`, 375, 520);
      ctx.fillText(`最终愤怒值：${Math.max(0, res.angerValue)}`, 375, 580);

      // 恋爱对象的话
      if (res.closingMessage) {
        ctx.fillStyle = '#636E72';
        ctx.font = 'italic 22px "PingFang SC", "Microsoft YaHei", sans-serif';
        const closingText = res.closingMessage.length > 40 ? res.closingMessage.slice(0, 40) + '...' : res.closingMessage;
        ctx.fillText(`"${closingText}"`, 375, 650);
      }

      // 分割线
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(100, 710);
      ctx.lineTo(650, 710);
      ctx.stroke();

      // 二维码
      const qrImage = new window.Image();
      qrImage.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = reject;
        qrImage.src = qrImgDataUrl;
      });
      const qrSize = 200;
      const qrX = 375 - qrSize / 2;
      const qrY = 740;
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // 二维码下方文案
      ctx.fillStyle = '#FF6B6B';
      ctx.font = 'bold 30px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('扫码来试试你能哄好吗？', 375, 1000);

      // 链接文案
      ctx.fillStyle = '#999999';
      ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(shareUrl, 375, 1050);

      // 底部品牌
      ctx.fillStyle = '#CCCCCC';
      ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('哄哄模拟器 - 恋爱吵架求生指南', 375, 1120);

      // 转为图片URL
      const dataUrl = canvas.toDataURL('image/png');
      setShareCardUrl(dataUrl);
      setCardReady(true);
    } catch {
      console.error('分享卡片生成失败');
    }
  }, []);

  // 分享到微信
  const handleShare = useCallback(async () => {
    if (!result) return;
    setSharing(true);

    const shareUrl = window.location.origin;
    const effectiveRounds = result.rounds ?? result.round ?? 0;
    const shareText = `我在哄哄模拟器里${result.status === 'won' ? '成功哄好了' : '没能哄好'}${result.partnerName}！用了${effectiveRounds}轮，你能比我厉害吗？`;

    try {
      // 1. 优先使用 Web Share API（Safari/Chrome 等外部浏览器支持）
      if (navigator.share) {
        // 尝试带图片分享
        if (navigator.canShare && shareCardUrl) {
          try {
            const response = await fetch(shareCardUrl);
            const blob = await response.blob();
            const file = new File([blob], '哄哄模拟器-成绩单.png', { type: 'image/png' });
            const shareData = { title: '哄哄模拟器', text: shareText, url: shareUrl, files: [file] };
            if (navigator.canShare(shareData)) {
              await navigator.share(shareData);
              setSharing(false);
              return;
            }
          } catch {
            // 文件分享不可用，继续尝试纯文本分享
          }
        }
        // 纯文本+链接分享
        try {
          await navigator.share({
            title: '哄哄模拟器',
            text: `${shareText} ${shareUrl}`,
            url: shareUrl,
          });
          setSharing(false);
          return;
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            setSharing(false);
            return;
          }
          // 用户取消或其他错误，继续 fallback
        }
      }

      // 2. 不支持 Web Share API（微信内置浏览器等）→ 复制链接 + 提示长按保存图片
      try {
        await navigator.clipboard.writeText(shareText + ' ' + shareUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } catch {
        // clipboard 不可用时用 textarea 兜底
        const textArea = document.createElement('textarea');
        textArea.value = shareText + ' ' + shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      }
    } catch {
      // 最终兜底：复制链接
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } catch {
        // 忽略
      }
    } finally {
      setSharing(false);
    }
  }, [result, shareCardUrl]);

  const handleCopyLink = useCallback(async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, []);

  const handleRestart = useCallback(() => {
    sessionStorage.removeItem('gameResultData');
    router.push('/');
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isWon = result.status === 'won';
  const effectiveRoundsUI = result.rounds ?? result.round ?? 0;
  const rating = isWon ? getRatingLevel(effectiveRoundsUI, result.usedRescue) : null;

  const statusMessages: Record<GameStatus, string> = {
    won: '你成功获得了对方的谅解！',
    lost: '虽然没能完全哄好，但你已经尽力了...',
    exploded: '对方已经忍无可忍了...',
    lost_over_100: '对方已经忍无可忍了...',
    lost_rounds: '机会用完了，对方还是没消气...',
    lost_illegal: '你说的话让对方很不舒服，对方不想再和你说话了。',
    violated: '你说的话让对方很不舒服，对方不想再和你说话了。',
    playing: '',
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <div ref={cardRef} className="w-full max-w-md">
        {/* 主卡片 */}
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center result-pop-in">
          {/* 大图标 */}
          <div className="text-6xl mb-4">
            {isWon ? '🎉' : result.status === 'lost_illegal' ? '🚫' : '💔'}
          </div>

          {/* 结果标题 */}
          <h2 className={`text-2xl font-bold mb-2 ${isWon ? 'text-anger-forgiving' : 'text-anger-furious'}`}>
            {isWon ? '哄哄成功！' : '哄哄失败'}
          </h2>

          {/* 评价等级 */}
          {rating && (
            <div className="mb-4">
              <span className="text-3xl">{rating.emoji}</span>
              <p className="text-lg font-medium text-charcoal mt-1">{rating.title}</p>
              <p className="text-sm text-soft-gray">{rating.description}</p>
            </div>
          )}

          {/* 失败原因 */}
          {!isWon && (
            <p className="text-sm text-soft-gray mb-4">{statusMessages[result.status]}</p>
          )}

          {/* 对象信息 */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-cream">
              {result.avatarUrl ? (
                <Image src={result.avatarUrl} alt={result.partnerName} width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">😤</div>
              )}
            </div>
            <div className="text-left">
              <p className="font-medium text-sm text-charcoal">{result.partnerName}</p>
              <p className="text-xs text-soft-gray">{getAvatarTypeLabel(result.avatarType, result.gender)}</p>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-cream rounded-xl p-3">
              <p className="text-2xl font-bold text-coral">{effectiveRoundsUI}</p>
              <p className="text-xs text-soft-gray">使用轮数</p>
            </div>
            <div className="bg-cream rounded-xl p-3">
              <p className="text-2xl font-bold" style={{ color: isWon ? '#2ED573' : '#FF4757' }}>
                {Math.max(0, result.angerValue)}
              </p>
              <p className="text-xs text-soft-gray">最终愤怒值</p>
            </div>
          </div>

          {/* 恋爱对象说的话 */}
          {result.closingMessage && (
            <div className="bg-cream rounded-xl p-4 mb-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-white flex-shrink-0">
                  {result.avatarUrl ? (
                    <Image src={result.avatarUrl} alt="" width={24} height={24} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">{isWon ? '😊' : '😤'}</span>
                  )}
                </div>
                <span className="text-xs text-soft-gray font-medium">{result.partnerName}说：</span>
              </div>
              <p className={`text-sm leading-relaxed ${isWon ? 'text-anger-forgiving' : 'text-soft-gray'}`}>
                &ldquo;{result.closingMessage}&rdquo;
              </p>
              {result.closingAudioUrl && (
                <audio controls className="mt-2 mx-auto h-8" src={result.closingAudioUrl} preload="none">
                  <track kind="captions" />
                </audio>
              )}
            </div>
          )}
        </div>

        {/* 分享区域 - 一键分享 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4 text-center">
          <h3 className="text-base font-bold text-charcoal mb-3">分享给朋友来挑战</h3>

          {/* 分享卡片预览 - 长按可保存 */}
          {shareCardUrl && (
            <div className="mb-4 relative">
              <img
                src={shareCardUrl}
                alt="哄哄模拟器成绩单"
                className="w-full rounded-xl shadow-sm"
                style={{ WebkitTouchCallout: 'default', userSelect: 'auto' }}
              />
              <p className="text-xs text-soft-gray mt-1.5">👇 长按图片保存到相册，发到微信好友</p>
            </div>
          )}

          {/* 一键分享按钮 */}
          <div className="space-y-3">
            {/* 主分享按钮 */}
            <button
              onClick={handleShare}
              disabled={sharing || !cardReady}
              className="w-full py-3.5 rounded-xl bg-[#FF6B6B] text-white font-bold text-base shadow-md hover:bg-[#FF5252] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05a6.42 6.42 0 01-.248-1.753c0-3.694 3.514-6.692 7.84-6.692.282 0 .56.014.833.037C16.86 4.546 13.142 2.188 8.691 2.188zm-2.6 4.408c.56 0 1.015.46 1.015 1.025 0 .566-.455 1.025-1.014 1.025-.56 0-1.015-.46-1.015-1.025 0-.566.456-1.025 1.015-1.025zm5.214 0c.56 0 1.014.46 1.014 1.025 0 .566-.455 1.025-1.014 1.025-.56 0-1.015-.46-1.015-1.025 0-.566.456-1.025 1.015-1.025zM16.886 9.3c-3.86 0-6.99 2.607-6.99 5.82 0 3.214 3.13 5.82 6.99 5.82.757 0 1.48-.118 2.163-.322a.67.67 0 01.55.075l1.458.854a.25.25 0 00.128.042.226.226 0 00.222-.226c0-.055-.022-.11-.037-.163l-.299-1.132a.453.453 0 01.163-.51C22.548 18.593 23.46 16.95 23.46 15.12c0-3.213-3.13-5.82-6.99-5.82h.416zm-2.585 3.344c.43 0 .778.353.778.787 0 .434-.348.786-.778.786-.429 0-.777-.352-.777-.786 0-.434.348-.787.777-.787zm5.17 0c.43 0 .778.353.778.787 0 .434-.348.786-.778.786-.429 0-.777-.352-.777-.786 0-.434.348-.787.778-.787z"/>
              </svg>
              {sharing ? '分享中...' : '分享给好友'}
            </button>

            {/* 复制链接 */}
            <button
              onClick={handleCopyLink}
              className="w-full py-3 rounded-xl bg-cream text-charcoal font-medium text-sm hover:bg-cream-dark transition-all flex items-center justify-center gap-2"
            >
              {copySuccess ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ED573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="text-green-500">链接已复制，粘贴给好友</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  复制链接
                </>
              )}
            </button>

            {/* 再来一局 */}
            <button
              onClick={handleRestart}
              className="w-full py-3 rounded-xl border-2 border-coral text-coral font-medium text-sm hover:bg-coral hover:text-white transition-all"
            >
              再来一局
            </button>
          </div>
        </div>
      </div>
      
      {/* 游戏记录保存成功提示 */}
      {recordSaved && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm animate-fade-in z-50">
          ✓ 您的游戏记录已经保存
        </div>
      )}
      
      {/* 保存失败提示 */}
      {saveError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg text-sm animate-fade-in z-50">
          保存失败: {saveError}
        </div>
      )}
      
      {/* 未登录弹窗提示 */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-coral/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#2D3436] mb-2">登录后可保存你的游戏记录</h3>
              <p className="text-sm text-[#636E72] mb-6">
                登录账户后，您的游戏成绩将被保存，方便查看历史记录
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
                >
                  稍后再说
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="flex-1 py-2 rounded-xl bg-coral text-white text-sm hover:bg-coral/90"
                >
                  去登录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
