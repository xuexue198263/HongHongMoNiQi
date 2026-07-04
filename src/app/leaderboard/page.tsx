'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserMenu } from '@/components/UserMenu';

interface LeaderboardEntry {
  id: number;
  user_id: number;
  username: string;
  best_score: number;
  achieved_at: string;
  rank: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leaderboard');
      if (!res.ok) {
        throw new Error('获取排行榜失败');
      }
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setCurrentUserId(data.currentUserId || null);
    } catch (err) {
      console.error('获取排行榜异常:', err);
      setError('加载排行榜失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getScoreDisplay = (score: number) => {
    // Score is the affection score (100 - anger), higher is better
    if (score === 100) return '满分！';
    return `${score}分`;
  };

  return (
    <div className="min-h-screen bg-warm-cream flex flex-col items-center px-4 py-8">
      {/* 用户菜单 */}
      <div className="w-full max-w-md flex justify-end mb-2">
        <UserMenu />
      </div>

      {/* 标题 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-coral mb-2">🏆 哄人排行榜</h1>
        <p className="text-soft-gray text-sm">看看谁是哄人高手！分数越高越好（满分100分）</p>
      </div>

      {/* 排行榜列表 */}
      <div className="w-full max-w-md">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-3xl mb-4">⏳</div>
            <p className="text-soft-gray">加载中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-coral">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-4 px-4 py-2 rounded-xl bg-coral text-white font-medium"
            >
              重试
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-soft-gray mb-4">暂无排行数据</p>
            <p className="text-xs text-soft-gray">登录用户完成游戏后成绩会自动上榜</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-sm transition-all ${
                  entry.isCurrentUser
                    ? 'bg-coral/10 border-2 border-coral shadow-md scale-105'
                    : 'bg-white hover:shadow-md'
                }`}
              >
                {/* 排名 */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  entry.rank <= 3
                    ? 'text-lg'
                    : 'text-sm bg-gray-100 text-soft-gray'
                }`}>
                  {getRankBadge(entry.rank)}
                </div>

                {/* 用户名 */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    entry.isCurrentUser ? 'text-coral' : 'text-dark-gray'
                  }`}>
                    {entry.username}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-xs bg-coral text-white px-2 py-0.5 rounded-full">
                        我
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-soft-gray">
                    {formatDate(entry.achieved_at)}
                  </p>
                </div>

                {/* 分数 */}
                <div className={`text-right ${
                  entry.best_score === 100
                    ? 'text-green-500 font-bold'
                    : entry.isCurrentUser
                      ? 'text-coral font-semibold'
                      : 'text-dark-gray'
                }`}>
                  <p className="text-lg font-semibold">
                    {getScoreDisplay(entry.best_score)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 当前用户不在榜提示 */}
        {!loading && !error && currentUserId && leaderboard.length > 0 && 
         !leaderboard.some(e => e.isCurrentUser) && (
          <div className="mt-6 text-center bg-white rounded-xl p-4 shadow-sm">
            <p className="text-soft-gray text-sm">
              你还没有上榜，快来玩一局试试！
            </p>
          </div>
        )}

        {/* 未登录提示 */}
        {!loading && !error && !currentUserId && (
          <div className="mt-6 text-center bg-white rounded-xl p-4 shadow-sm">
            <p className="text-soft-gray text-sm mb-2">
              登录后你的成绩才能上榜
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 rounded-xl bg-coral text-white font-medium text-sm hover:bg-coral/90 transition-colors"
            >
              去登录
            </button>
          </div>
        )}
      </div>

      {/* 返回首页 */}
      <button
        onClick={() => router.push('/')}
        className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-all text-soft-gray hover:text-coral"
      >
        <span>←</span>
        <span className="text-sm font-medium">返回首页</span>
      </button>
    </div>
  );
}