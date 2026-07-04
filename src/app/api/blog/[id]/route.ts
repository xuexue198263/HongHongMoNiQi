import { NextRequest, NextResponse } from 'next/server';
import { getDb, blogPosts } from '@/storage/database/pg-client';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  if (!db) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  const data = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      summary: blogPosts.summary,
      content: blogPosts.content,
      created_at: blogPosts.created_at,
    })
    .from(blogPosts)
    .where(eq(blogPosts.id, parseInt(id)))
    .limit(1);

  if (!data || data.length === 0) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  return NextResponse.json({ post: data[0] });
}