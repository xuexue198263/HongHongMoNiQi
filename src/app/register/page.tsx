'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!username.trim()) {
      setError('用户名不能为空');
      return;
    }
    if (username.length < 2 || username.length > 20) {
      setError('用户名长度需为2-20个字符');
      return;
    }
    if (!password) {
      setError('密码不能为空');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少6个字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败');
        return;
      }

      // Registration successful, redirect to home
      router.push('/');
    } catch {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFF8F0' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#FF6B6B' }}>哄哄模拟器</h1>
          <p className="text-gray-500 mt-2">创建账号，开始你的哄人之旅</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6B6B] focus:outline-none transition-colors"
              placeholder="2-20个字符"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6B6B] focus:outline-none transition-colors"
              placeholder="至少6个字符"
              disabled={loading}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6B6B] focus:outline-none transition-colors"
              placeholder="再次输入密码"
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#FF6B6B' }}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center mt-4 text-gray-500">
          已有账号？{' '}
          <Link href="/login" className="text-[#FF6B6B] font-medium hover:opacity-80">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}