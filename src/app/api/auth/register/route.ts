import { NextRequest, NextResponse } from 'next/server';
import { getDb, users } from '@/storage/database/pg-client';
import { eq } from 'drizzle-orm';
import { hashPassword, generateToken, setSessionCookie } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    if (username.length < 2 || username.length > 20) {
      return NextResponse.json({ error: '用户名长度需在2-20字符之间' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 });
    }

    const db = getDb();

    if (!db) {
      return NextResponse.json({ error: '数据库服务暂不可用，请稍后重试' }, { status: 503 });
    }

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await db
      .insert(users)
      .values({ username, password: hashedPassword })
      .returning({ id: users.id, username: users.username });

    if (!newUser || newUser.length === 0) {
      throw new Error('用户注册失败');
    }

    const token = await generateToken({ id: newUser[0].id, username: newUser[0].username });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: newUser[0].id, username: newUser[0].username }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}