'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserInfo {
  id: number;
  username: string;
}

export function UserMenu() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.refresh();
  };

  if (loading) {
    return null;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="text-sm text-[#636E72] hover:text-[#FF6B6B] transition-colors"
        >
          欢迎，<span className="text-[#FF6B6B] font-medium">{user.username}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 rounded-full bg-white border border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FFF0F0] transition-colors"
        >
          退出
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="text-sm px-3 py-1.5 rounded-full bg-white border border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FFF0F0] transition-colors"
      >
        登录
      </Link>
      <Link
        href="/register"
        className="text-sm px-3 py-1.5 rounded-full bg-[#FF6B6B] text-white hover:bg-[#FF5252] transition-colors"
      >
        注册
      </Link>
    </div>
  );
}