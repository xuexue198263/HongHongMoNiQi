import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/storage/database/shared/schema';

async function initDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });

  const db = drizzle(pool, { schema });

  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = (result.rows as Array<{ table_name: string }>).map(r => r.table_name);
    console.log('Existing tables:', existingTables);

    if (!existingTables.includes('users')) {
      console.log('Creating users table...');
      await db.execute(sql`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
        CREATE INDEX users_username_idx ON users(username);
      `);
      console.log('Users table created');
    } else {
      console.log('Users table already exists');
    }

    if (!existingTables.includes('game_records')) {
      console.log('Creating game_records table...');
      await db.execute(sql`
        CREATE TABLE game_records (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          scenario VARCHAR(200) NOT NULL,
          final_score INTEGER NOT NULL,
          result VARCHAR(20) NOT NULL,
          played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
        CREATE INDEX game_records_user_id_idx ON game_records(user_id);
        CREATE INDEX game_records_played_at_idx ON game_records(played_at);
      `);
      console.log('Game records table created');
    } else {
      console.log('Game records table already exists');
    }

    if (!existingTables.includes('leaderboard')) {
      console.log('Creating leaderboard table...');
      await db.execute(sql`
        CREATE TABLE leaderboard (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          username VARCHAR(50) NOT NULL,
          best_score INTEGER NOT NULL,
          achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
        CREATE INDEX leaderboard_best_score_idx ON leaderboard(best_score);
        CREATE INDEX leaderboard_user_id_idx ON leaderboard(user_id);
      `);
      console.log('Leaderboard table created');
    } else {
      console.log('Leaderboard table already exists');
    }

    if (!existingTables.includes('blog_posts')) {
      console.log('Creating blog_posts table...');
      await db.execute(sql`
        CREATE TABLE blog_posts (
          id SERIAL PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          summary TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
        CREATE INDEX blog_posts_created_at_idx ON blog_posts(created_at);
      `);
      console.log('Blog posts table created');
    } else {
      console.log('Blog posts table already exists');
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    await pool.end();
  }
}

import { sql } from 'drizzle-orm';

initDb();
