import { NextRequest, NextResponse } from 'next/server';
import { getDb, users } from '@/storage/database/pg-client';
import { eq } from 'drizzle-orm';
import { verifyPassword, generateToken, setSessionCookie } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const db = getDb();

    if (!db) {
      return NextResponse.json({ error: '数据库服务暂不可用，请稍后重试' }, { status: 503 });
    }

    const user = await db
      .select({ id: users.id, username: users.username, password: users.password })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 400 });
    }

    const isValid = await verifyPassword(password, user[0].password);

    if (!isValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 400 });
    }

    const token = await generateToken({ id: user[0].id, username: user[0].username });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: user[0].id, username: user[0].username }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 });
  }
}