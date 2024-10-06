/* eslint-disable ts/no-use-before-define */
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  type SQLiteColumn,
} from "drizzle-orm/sqlite-core";

const namedIndex = (column: SQLiteColumn, ...columns: SQLiteColumn[]) =>
  index(
    `${column.uniqueName?.replace(`_${column.name}_unique`, "")}_${[
      column,
      ...columns,
    ]
      .map(column => column.name)
      .join("_")}_idx`,
  ).on(column, ...columns);

const boolean = (name: string) => integer(name, { mode: "boolean" });
const timestamp = (name: string) => integer(name, { mode: "timestamp" });

export const guilds = sqliteTable(
  "guilds",
  {
    id: text("id").primaryKey(),
    deleted: boolean("deleted").notNull().default(false),
  },
  table => ({
    deletedIdx: namedIndex(table.deleted),
  }),
);
export const guildsRelations = relations(guilds, ({ many }) => ({
  members: many(members),
  channels: many(channels),
  messages: many(messages),
}));

export const members = sqliteTable(
  "members",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.id, { onDelete: "cascade" }),
    bot: boolean("bot").notNull().default(false),
    removed: boolean("removed").notNull().default(false),
  },
  table => ({
    guildIdIdx: namedIndex(table.guildId),
  }),
);
export const membersRelations = relations(members, ({ one }) => ({
  guild: one(guilds, {
    fields: [members.guildId],
    references: [guilds.id],
  }),
}));

export const channels = sqliteTable(
  "channels",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.id, { onDelete: "set null" }),
    nsfw: boolean("nsfw").notNull().default(false),
    deleted: boolean("deleted").notNull().default(false),
  },
  table => ({
    guildIdIdx: namedIndex(table.guildId),
  }),
);
export const channelsRelations = relations(channels, ({ one, many }) => ({
  guild: one(guilds, {
    fields: [channels.guildId],
    references: [guilds.id],
  }),
  messages: many(messages),
}));

/**
 * @see https://discord.com/developers/docs/resources/channel#message-object
 */
export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("timestamp"),
    updatedAt: timestamp("edited_timestamp"),
    authorId: text("author_id").notNull(),
    channelId: text("channel_id").notNull(),
    guildId: text("guild_id"),
    content: text("content").notNull(),
    deleted: boolean("deleted").notNull().default(false),
  },
  table => ({
    authorIdIdx: namedIndex(table.authorId),
    channelIdIdx: namedIndex(table.channelId),
    guildIdIdx: namedIndex(table.guildId),
  }),
);
export const messagesRelations = relations(messages, ({ one, many }) => ({
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
  guild: one(guilds, {
    fields: [messages.guildId],
    references: [guilds.id],
  }),
  attachments: many(attachments),
}));

/**
 * @see https://discord.com/developers/docs/resources/channel#attachment-object
 */
export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    channelId: text("channel_id").references(() => channels.id, {
      onDelete: "set null",
    }),
    guildId: text("guild_id").references(() => guilds.id, {
      onDelete: "set null",
    }),
    filename: text("filename").notNull(),
    ext: text("extension"),
    contentType: text("content_type"),
    bot: boolean("bot").notNull().default(false),
    nsfw: boolean("nsfw").notNull().default(false),
  },
  table => ({
    messageIdIdx: namedIndex(table.messageId),
    channelIdIdx: namedIndex(table.channelId),
    guildIdIdx: namedIndex(table.guildId),
  }),
);
export const attachmentsRelations = relations(attachments, ({ one }) => ({
  channel: one(channels, {
    fields: [attachments.channelId],
    references: [channels.id],
  }),
  message: one(messages, {
    fields: [attachments.messageId],
    references: [messages.id],
  }),
  guild: one(guilds, {
    fields: [attachments.guildId],
    references: [guilds.id],
  }),
}));
