import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth-utils';

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: '退出登录失败' }, { status: 500 });
  }
}