'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface BlogPost {
  id: number;
  title: string;
  summary: string;
  created_at: string;
}

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // 获取博客列表
  useEffect(() => {
    fetch('/api/blog')
      .then(res => res.json())
      .then(data => {
        if (data.posts) {
          setPosts(data.posts);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('获取博客列表失败:', err);
        setLoading(false);
      });
  }, []);

  // 生成新文章
  const handleGenerateNew = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/blog/generate', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.post) {
        // 添加新文章到列表顶部
        setPosts(prev => [data.post, ...prev]);
      } else {
        alert(data.error || '生成失败');
      }
    } catch (err) {
      console.error('生成文章失败:', err);
      alert('生成文章失败');
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-8">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between max-w-md mx-auto mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-[#636E72] hover:text-[#FF6B6B] transition-colors"
        >
          ← 返回首页
        </button>
        <h1 className="text-xl font-bold text-[#FF6B6B]">恋爱攻略</h1>
      </div>

      {/* 生成新文章按钮 */}
      <div className="max-w-md mx-auto mb-4">
        <button
          onClick={handleGenerateNew}
          disabled={isGenerating}
          className={`w-full py-3 rounded-xl font-medium transition-all ${
            isGenerating
              ? 'bg-[#FFB4B4] text-white cursor-not-allowed'
              : 'bg-[#FF6B6B] text-white hover:bg-[#FF8E8E] active:scale-[0.98]'
          }`}
        >
          {isGenerating ? '✨ 正在生成新文章...' : '✨ 生成新文章'}
        </button>
      </div>

      {/* 文章列表 */}
      <div className="max-w-md mx-auto space-y-4">
        {loading ? (
          <div className="text-center text-[#636E72] py-8">加载中...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-[#636E72] py-8">暂无文章</div>
        ) : (
          posts.map((post) => (
            <button
              key={post.id}
              onClick={() => router.push(`/blog/${post.id}`)}
              className="w-full bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FF6B6B]/10 flex items-center justify-center text-2xl">
                  📝
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-[#2D3436] mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-[#636E72] line-clamp-2">
                    {post.summary}
                  </p>
                  <p className="text-xs text-[#636E72]/60 mt-2">
                    {new Date(post.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}