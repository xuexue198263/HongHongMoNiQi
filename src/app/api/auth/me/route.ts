import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getSessionFromCookie } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const token = await getSessionFromCookie();
    
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: { id: payload.id, username: payload.username }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}