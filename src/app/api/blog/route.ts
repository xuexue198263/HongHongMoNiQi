import { NextResponse } from 'next/server';
import { getDb, blogPosts } from '@/storage/database/pg-client';
import { desc } from 'drizzle-orm';

export async function GET() {
  const db = getDb();

  if (!db) {
    return NextResponse.json({ posts: [] });
  }

  const data = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      summary: blogPosts.summary,
      created_at: blogPosts.created_at,
    })
    .from(blogPosts)
    .orderBy(desc(blogPosts.created_at));

  return NextResponse.json({ posts: data });
}