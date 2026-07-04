import { NextRequest, NextResponse } from 'next/server';
import { getDb, leaderboard } from '@/storage/database/pg-client';
import { eq, desc, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-utils';

export async function GET() {
  try {
    const db = getDb();
    
    if (!db) {
      const currentUser = await getCurrentUser();
      return NextResponse.json({ 
        leaderboard: [],
        currentUserId: currentUser?.id || null,
      });
    }

    const data = await db
      .select({
        id: leaderboard.id,
        user_id: leaderboard.user_id,
        username: leaderboard.username,
        best_score: leaderboard.best_score,
        achieved_at: leaderboard.achieved_at,
      })
      .from(leaderboard)
      .orderBy(desc(leaderboard.best_score))
      .limit(20);

    const currentUser = await getCurrentUser();
    
    const leaderboardWithRank = data.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      isCurrentUser: currentUser?.id === entry.user_id,
    }));

    return NextResponse.json({ 
      leaderboard: leaderboardWithRank,
      currentUserId: currentUser?.id || null,
    });
  } catch (err) {
    console.error('获取排行榜异常:', err);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '请登录后更新排行榜' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { score } = body;

    if (score === undefined || score === null) {
      return NextResponse.json(
        { error: '缺少分数参数' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        error: '数据库服务暂不可用',
        isNewRecord: false,
      }, { status: 503 });
    }
    
    const existingEntry = await db
      .select({ best_score: leaderboard.best_score })
      .from(leaderboard)
      .where(eq(leaderboard.user_id, user.id))
      .limit(1);

    const shouldUpdate = existingEntry.length === 0 || score > existingEntry[0].best_score;

    if (shouldUpdate) {
      await db.insert(leaderboard)
        .values({
          user_id: user.id,
          username: user.username,
          best_score: score,
          achieved_at: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: leaderboard.user_id,
          set: {
            username: user.username,
            best_score: score,
            achieved_at: new Date().toISOString(),
          },
        });

      return NextResponse.json({ 
        success: true, 
        message: existingEntry.length > 0 ? '刷新了您的最高纪录！' : '首次上榜！',
        isNewRecord: existingEntry.length === 0 || score > existingEntry[0].best_score,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: '当前分数未超过最高纪录',
      isNewRecord: false,
    });
  } catch (err) {
    console.error('更新排行榜异常:', err);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}