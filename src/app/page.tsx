'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  type AvatarType,
  type Difficulty,
  PRESET_SCENES,
  DIFFICULTY_LEVELS,
  AVATAR_IMAGE_MAP,
  getAvatarTypeLabel,
} from '@/lib/game-types';
import { UserMenu } from '@/components/UserMenu';

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [partnerName, setPartnerName] = useState('');
  const [gender, setGender] = useState<string>('female');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [selectedScene, setSelectedScene] = useState<string>('');
  const [avatarType, setAvatarType] = useState<AvatarType | ''>('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const avatarTypes: AvatarType[] = ['gentle', 'lively', 'cool', 'friendly'];

  const getAvatarUrl = (type: AvatarType): string => {
    const prefix = gender === 'male' ? 'male' : 'female';
    return AVATAR_IMAGE_MAP[`${prefix}_${type}`] || '';
  };

  const handleSelectAvatar = (type: AvatarType) => {
    setAvatarType(type);
    setAvatarUrl(getAvatarUrl(type));
  };

  const canGoNext = partnerName.trim() && gender && selectedScene;
  const canStart = !!avatarType;

  const handleStart = async () => {
    if (!canStart) return;
    setLoading(true);
    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          partnerName: partnerName.trim(),
          avatarType,
          avatarUrl,
          sceneId: selectedScene,
          difficulty,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || '游戏初始化失败');
        return;
      }
      const data = await res.json();
      sessionStorage.setItem('gameInitData', JSON.stringify({
        ...data,
        gender,
        partnerName: partnerName.trim(),
        avatarType,
        avatarUrl,
        sceneId: selectedScene,
        difficulty,
      }));
      router.push('/game');
    } catch {
      alert('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 py-8">
      {/* 用户菜单 */}
      <div className="w-full max-w-md flex justify-end mb-2">
        <UserMenu />
      </div>

      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">哄哄模拟器</h1>
        <p className="text-black/60 text-sm">在各种吵架场景中练习哄人，看你能哄好吗？</p>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-coral' : 'text-black/60'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            step === 1 ? 'bg-coral text-white' : 'bg-gray-200 text-black'
          }`}>1</div>
          <span className="text-sm font-medium">基本设置</span>
        </div>
        <div className="w-8 h-0.5 bg-gray-200" />
        <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-coral' : 'text-black/60'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            step === 2 ? 'bg-coral text-white' : 'bg-gray-200 text-black'
          }`}>2</div>
          <span className="text-sm font-medium">选择头像</span>
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* 第一步：基本设置 */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. 恋爱对象姓名 */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">恋爱对象姓名</label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="请输入TA的名字"
                maxLength={10}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-coral focus:outline-none transition-colors text-black bg-white"
              />
            </div>

            {/* 2. 恋爱对象性别 */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">恋爱对象性别</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'female', label: '👩 女朋友' },
                  { value: 'male', label: '👨 男朋友' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGender(opt.value)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                      gender === opt.value
                        ? 'bg-coral text-white shadow-md scale-105'
                        : 'bg-white text-black border-2 border-gray-200 hover:border-coral/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 难度选择 */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">选择难度</label>
              <div className="grid grid-cols-3 gap-3">
                {DIFFICULTY_LEVELS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`py-3 px-2 rounded-xl text-center transition-all ${
                      difficulty === d.id
                        ? 'bg-coral text-white shadow-md scale-105'
                        : 'bg-white text-black border-2 border-gray-200 hover:border-coral/50'
                    }`}
                  >
                    <div className="text-lg">{d.emoji}</div>
                    <div className="text-sm font-semibold mt-1">{d.label}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-black/60 mt-1 text-center">
                {DIFFICULTY_LEVELS.find(d => d.id === difficulty)?.desc}
              </p>
            </div>

            {/* 4. 选择吵架场景 */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">选择吵架场景</label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_SCENES.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => setSelectedScene(scene.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all text-left ${
                      selectedScene === scene.id
                        ? 'bg-coral text-white shadow-md'
                        : 'bg-white text-black border-2 border-gray-200 hover:border-coral/50'
                    }`}
                  >
                    {scene.name}
                  </button>
                ))}
              </div>
              {selectedScene && (
                <p className="text-xs text-black/60 mt-2 bg-white p-3 rounded-xl">
                  {PRESET_SCENES.find(s => s.id === selectedScene)?.desc}
                </p>
              )}
            </div>

            {/* 下一步按钮 */}
            <button
              onClick={() => setStep(2)}
              disabled={!canGoNext}
              className={`w-full py-4 rounded-2xl text-lg font-bold transition-all ${
                canGoNext
                  ? 'bg-coral text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              下一步：选择头像 →
            </button>
          </div>
        )}

        {/* 第二步：选择头像 */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* 返回按钮 */}
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-black/60 hover:text-coral transition-colors"
            >
              ← 返回修改设置
            </button>

            {/* 设置摘要 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-black/60">姓名</span>
                <span className="text-black font-medium">{partnerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/60">性别</span>
                <span className="text-black font-medium">{gender === 'female' ? '👩 女朋友' : '👨 男朋友'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/60">难度</span>
                <span className="text-black font-medium">
                  {DIFFICULTY_LEVELS.find(d => d.id === difficulty)?.emoji} {DIFFICULTY_LEVELS.find(d => d.id === difficulty)?.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/60">场景</span>
                <span className="text-black font-medium">
                  {PRESET_SCENES.find(s => s.id === selectedScene)?.name}
                </span>
              </div>
            </div>

            {/* 头像选择 */}
            <div>
              <label className="block text-sm font-semibold text-black mb-3">
                选择你的{gender === 'male' ? '男友' : '女友'}头像
              </label>
              <div className="grid grid-cols-2 gap-4">
                {avatarTypes.map((type) => {
                  const url = getAvatarUrl(type);
                  const label = getAvatarTypeLabel(type, gender);
                  return (
                    <button
                      key={type}
                      onClick={() => handleSelectAvatar(type)}
                      className={`flex flex-col items-center p-4 rounded-2xl transition-all ${
                        avatarType === type
                          ? 'bg-coral/10 border-2 border-coral shadow-lg scale-105'
                          : 'bg-white border-2 border-gray-200 hover:border-coral/50 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-24 h-24 rounded-full overflow-hidden mb-3 ${
                        avatarType === type ? 'ring-4 ring-coral/30' : ''
                      }`}>
                        {url && (
                          <Image
                            src={url}
                            alt={label}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${
                        avatarType === type ? 'text-coral' : 'text-black'
                      }`}>
                        {label}
                      </span>
                      {avatarType === type && (
                        <span className="text-xs text-coral mt-1">✓ 已选择</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 开始按钮 */}
            <button
              onClick={handleStart}
              disabled={!canStart || loading}
              className={`w-full py-4 rounded-2xl text-lg font-bold transition-all ${
                canStart && !loading
                  ? 'bg-coral text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> 正在初始化...
                </span>
              ) : (
                '开始哄人！'
              )}
            </button>
          </div>
        )}
      </div>
      {/* 恋爱攻略和排行榜入口 */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => router.push('/blog')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-all text-black/60 hover:text-coral"
        >
          <span className="text-lg">📖</span>
          <span className="text-sm font-medium">恋爱攻略</span>
        </button>
        <button
          onClick={() => router.push('/leaderboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-all text-black/60 hover:text-coral"
        >
          <span className="text-lg">🏆</span>
          <span className="text-sm font-medium">排行榜</span>
        </button>
      </div>
    </div>
  );
}
