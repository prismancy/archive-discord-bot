/* eslint-disable ts/no-use-before-define */
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
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
  t => ({
    id: t.text().primaryKey(),
    deleted: boolean("deleted").notNull().default(false),
  }),
  t => ({
    deletedIdx: namedIndex(t.deleted),
  }),
);
export const guildsRelations = relations(guilds, ({ many }) => ({
  members: many(members),
  channels: many(channels),
  messages: many(messages),
}));

export const members = sqliteTable(
  "members",
  t => ({
    id: t.text().primaryKey(),
    guildId: t
      .text()
      .notNull()
      .references(() => guilds.id, { onDelete: "cascade" }),
    bot: boolean("bot").notNull().default(false),
    removed: boolean("removed").notNull().default(false),
  }),
  t => ({
    guildIdIdx: namedIndex(t.guildId),
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
  t => ({
    id: t.text().primaryKey(),
    guildId: t
      .text()
      .notNull()
      .references(() => guilds.id, { onDelete: "set null" }),
    nsfw: boolean("nsfw").notNull().default(false),
    deleted: boolean("deleted").notNull().default(false),
  }),
  t => ({
    guildIdIdx: namedIndex(t.guildId),
    deletedIdx: namedIndex(t.deleted),
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
  t => ({
    id: t.text().primaryKey(),
    createdAt: timestamp("timestamp"),
    updatedAt: timestamp("edited_timestamp"),
    authorId: t.text().notNull(),
    channelId: t.text().notNull(),
    guildId: t.text(),
    content: t.text().notNull(),
    deleted: boolean("deleted").notNull().default(false),
  }),
  t => ({
    authorIdIdx: namedIndex(t.authorId),
    channelIdIdx: namedIndex(t.channelId),
    guildIdIdx: namedIndex(t.guildId),
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
  t => ({
    id: t.text().primaryKey(),
    messageId: t.text().references(() => messages.id, {
      onDelete: "set null",
    }),
    channelId: t.text().references(() => channels.id, {
      onDelete: "set null",
    }),
    guildId: t.text().references(() => guilds.id, {
      onDelete: "set null",
    }),
    filename: t.text().notNull(),
    ext: t.text(),
    contentType: t.text(),
    bot: boolean("bot").notNull().default(false),
    nsfw: boolean("nsfw").notNull().default(false),
  }),
  t => ({
    messageIdIdx: namedIndex(t.messageId),
    channelIdIdx: namedIndex(t.channelId),
    guildIdIdx: namedIndex(t.guildId),
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
