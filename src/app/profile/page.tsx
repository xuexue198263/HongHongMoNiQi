'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface GameRecord {
  id: number;
  scenario: string;
  final_score: number;
  result: string;
  played_at: string;
}

interface UserInfo {
  id: number;
  username: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取用户信息
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        // 获取游戏记录
        const recordsRes = await fetch('/api/game/records');
        if (recordsRes.ok) {
          const recordsData = await recordsRes.json();
          setRecords(recordsData.records || []);
        }
      } catch (err) {
        setError('加载失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getResultEmoji = (result: string) => {
    return result === 'won' ? '🎉' : '💔';
  };

  const getResultText = (result: string) => {
    return result === 'won' ? '通关' : '失败';
  };

  const getResultColor = (result: string) => {
    return result === 'won' ? 'text-green-500' : 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-[#636E72]">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link href="/" className="text-[#636E72] hover:text-[#2D3436]">
            ← 返回首页
          </Link>
          <h1 className="font-bold text-[#2D3436]">个人主页</h1>
          <button onClick={handleLogout} className="text-coral hover:text-coral/80">
            退出
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-coral/10 rounded-full flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-xl text-[#2D3436]">{user?.username}</h2>
              <p className="text-sm text-[#636E72]">共玩了 {records.length} 局游戏</p>
            </div>
          </div>
        </div>

        {/* 游戏记录列表 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-[#2D3436] mb-4">游戏记录</h3>
          
          {records.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y2="2" x2="16" y1="6"/>
                  <line x1="8" y2="2" x2="8" y1="6"/>
                  <line x1="3" y2="10" x2="21" y1="10"/>
                </svg>
              </div>
              <p className="text-[#636E72]">还没有游戏记录</p>
              <Link href="/" className="text-coral hover:underline mt-2 inline-block">
                去玩一局试试 →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-[#FFF8F0] rounded-xl"
                >
                  <div>
                    <div className="font-medium text-[#2D3436]">{record.scenario}</div>
                    <div className="text-sm text-[#636E72]">{formatDate(record.played_at)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-lg">{record.final_score}%</div>
                      <div className={`text-sm ${getResultColor(record.result)}`}>
                        {getResultEmoji(record.result)} {getResultText(record.result)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}