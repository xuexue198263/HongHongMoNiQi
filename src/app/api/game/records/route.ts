import { NextRequest, NextResponse } from 'next/server';
import { getDb, gameRecords } from '@/storage/database/pg-client';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '请登录后保存游戏记录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { scenario, finalScore, result: gameResult } = body;

    if (!scenario || finalScore === undefined || !gameResult) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        error: '数据库服务暂不可用，无法保存游戏记录',
      }, { status: 503 });
    }
    
    await db.insert(gameRecords).values({
      user_id: user.id,
      scenario,
      final_score: finalScore,
      result: gameResult,
      played_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: '游戏记录已保存' });
  } catch (err) {
    console.error('保存游戏记录异常:', err);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '请登录后查看游戏记录' },
        { status: 401 }
      );
    }

    const db = getDb();
    
    if (!db) {
      return NextResponse.json({ 
        records: [],
        error: '数据库服务暂不可用',
      }, { status: 503 });
    }
    
    const data = await db
      .select({
        id: gameRecords.id,
        scenario: gameRecords.scenario,
        final_score: gameRecords.final_score,
        result: gameRecords.result,
        played_at: gameRecords.played_at,
      })
      .from(gameRecords)
      .where(eq(gameRecords.user_id, user.id))
      .orderBy(desc(gameRecords.played_at));

    return NextResponse.json({ records: data });
  } catch (err) {
    console.error('获取游戏记录异常:', err);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}