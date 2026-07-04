'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface BlogPost {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/blog/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.post) {
          setPost(data.post);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('获取文章详情失败:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-4">
        <p className="text-[#636E72]">加载中...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-4">
        <div className="text-4xl mb-4">😢</div>
        <p className="text-[#636E72] mb-4">文章不存在</p>
        <button
          onClick={() => router.push('/blog')}
          className="px-4 py-2 rounded-xl bg-[#FF6B6B] text-white text-sm font-medium"
        >
          返回攻略列表
        </button>
      </div>
    );
  }

  // 分段显示内容
  const paragraphs = post.content.split('\n\n').filter((p) => p.trim());

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-8">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between max-w-md mx-auto mb-6">
        <button
          onClick={() => router.push('/blog')}
          className="flex items-center gap-1 text-[#636E72] hover:text-[#FF6B6B] transition-colors"
        >
          ← 返回列表
        </button>
        <div className="text-xl">📝</div>
      </div>

      {/* 文章卡片 */}
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* 标题区 */}
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-[#2D3436]">{post.title}</h1>
          <p className="text-sm text-[#636E72] mt-2">{post.summary}</p>
          <p className="text-xs text-[#636E72]/60 mt-2">
            {new Date(post.created_at).toLocaleDateString('zh-CN')}
          </p>
        </div>

        {/* 内容区 */}
        <div className="p-5">
          {paragraphs.map((para, index) => (
            <p
              key={index}
              className="text-[#2D3436] text-sm leading-relaxed mb-4 last:mb-0"
            >
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="max-w-md mx-auto mt-6 flex justify-center gap-3">
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-xl bg-[#FF6B6B] text-white font-medium shadow-sm hover:shadow-md transition-all"
        >
          去哄人试试 →
        </button>
      </div>
    </div>
  );
}