import * as schema from "./schema";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

const sqlite = new Database(Bun.env.DATABASE_URL || "");
const db = drizzle(sqlite, { schema, casing: "snake_case" });
export default db;

export * from "drizzle-orm";
