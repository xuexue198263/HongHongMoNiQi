import { pgTable, integer, timestamp, varchar, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const healthCheck = pgTable("health_check", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const blogPosts = pgTable(
	"blog_posts",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		title: varchar("title", { length: 200 }).notNull(),
		summary: text("summary").notNull(),
		content: text("content").notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("blog_posts_created_at_idx").on(table.created_at),
	]
);

export const users = pgTable(
	"users",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		username: varchar("username", { length: 50 }).notNull().unique(),
		password: varchar("password", { length: 255 }).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("users_username_idx").on(table.username),
	]
);

export const gameRecords = pgTable(
	"game_records",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		user_id: integer("user_id").notNull(),
		scenario: varchar("scenario", { length: 200 }).notNull(),
		final_score: integer("final_score").notNull(),
		result: varchar("result", { length: 20 }).notNull(),
		played_at: timestamp("played_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("game_records_user_id_idx").on(table.user_id),
		index("game_records_played_at_idx").on(table.played_at),
	]
);

export const leaderboard = pgTable(
	"leaderboard",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		user_id: integer("user_id").notNull().unique(),
		username: varchar("username", { length: 50 }).notNull(),
		best_score: integer("best_score").notNull(),
		achieved_at: timestamp("achieved_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("leaderboard_best_score_idx").on(table.best_score),
		index("leaderboard_user_id_idx").on(table.user_id),
	]
);
