import db, { eq, inArray } from "./database";
import { attachments, channels, guilds, members, messages } from "./schema";
import { type Awaitable, Client, type ClientEvents } from "discord.js";
import { env } from "node:process";

console.log(`⏳ Starting...`);

const client = new Client({
  intents: [
    "Guilds",
    "GuildMembers",
    "GuildMessages",
    "DirectMessages",
    "MessageContent",
  ],
});

retryEvent("guildCreate", async guild => {
  await db.insert(guilds).values({
    id: guild.id,
  });
});
retryEvent("guildDelete", async guild => {
  await db.update(guilds).set({ deleted: true }).where(eq(guilds.id, guild.id));
});
retryEvent("guildMemberAdd", async member => {
  const existingMember = await db.query.members.findFirst({
    columns: { id: true },
    where: eq(members.id, member.id),
  });
  if (existingMember) {
    await db
      .update(members)
      .set({
        removed: false,
      })
      .where(eq(members.id, member.id));
  } else {
    await db.insert(members).values({
      id: member.id,
      guildId: member.guild.id,
      bot: member.user.bot,
    });
  }
});
retryEvent("guildMemberRemove", async member => {
  await db
    .update(members)
    .set({ removed: true })
    .where(eq(members.id, member.id));
});
retryEvent("channelCreate", async channel => {
  await db.insert(channels).values({
    id: channel.id,
    guildId: channel.guildId,
    nsfw: "nsfw" in channel ? channel.nsfw : undefined,
  });
});
retryEvent("channelUpdate", async (_oldChannel, channel) => {
  if (!("guildId" in channel)) {
    return;
  }

  const where = eq(channels.id, channel.id);
  const existingChannel = await db.query.channels.findFirst({
    columns: { id: true },
    where,
  });
  if (existingChannel) {
    await db
      .update(channels)
      .set({
        nsfw: "nsfw" in channel ? channel.nsfw : undefined,
      })
      .where(eq(channels.id, channel.id));
  } else {
    await db.insert(channels).values({
      id: channel.id,
      guildId: channel.guildId,
      nsfw: "nsfw" in channel ? channel.nsfw : undefined,
    });
  }
});
retryEvent("channelDelete", async channel => {
  await db
    .update(channels)
    .set({ deleted: true })
    .where(eq(channels.id, channel.id));
});
retryEvent("messageCreate", async message => {
  await db.insert(messages).values({
    id: message.id,
    createdAt: message.createdAt,
    guildId: message.guildId,
    channelId: message.channelId,
    authorId: message.author.id,
    content: message.content,
  });
  if (message.attachments.size) {
    await db.insert(attachments).values(
      message.attachments.map(attachment => ({
        id: attachment.id,
        messageId: message.id,
        filename: attachment.name,
        contentType: attachment.contentType,
        bot: message.author.bot,
        nsfw: "nsfw" in message.channel ? message.channel.nsfw : undefined,
      })),
    );
  }
});
retryEvent("messageUpdate", async (_oldMessage, message) => {
  if (message.partial) {
    message = await message.fetch();
  }

  const where = eq(messages.id, message.id);
  const existingMessage = await db.query.messages.findFirst({
    columns: { id: true },
    where,
  });
  if (existingMessage) {
    await db
      .update(messages)
      .set({
        updatedAt: message.editedAt,
        content: message.content,
      })
      .where(eq(messages.id, message.id));
    await db.delete(attachments).where(eq(attachments.messageId, message.id));
  } else {
    await db.insert(messages).values({
      id: message.id,
      createdAt: message.createdAt,
      guildId: message.guildId,
      channelId: message.channelId,
      authorId: message.author.id,
      content: message.content,
    });
  }

  if (message.attachments.size) {
    await db.insert(attachments).values(
      message.attachments.map(attachment => ({
        id: attachment.id,
        messageId: message.id,
        filename: attachment.name,
        contentType: attachment.contentType,
        bot: message.author.bot,
        nsfw: "nsfw" in message.channel ? message.channel.nsfw : undefined,
      })),
    );
  }
});
retryEvent("messageDelete", async message => {
  await db
    .update(messages)
    .set({ deleted: true })
    .where(eq(messages.id, message.id));
});
retryEvent("messageDeleteBulk", async messagesCol => {
  await db
    .update(messages)
    .set({ deleted: true })
    .where(inArray(messages.id, [...messagesCol.keys()]));
});

client.once("ready", () => {
  console.log(`✅ Ready!`);
  client.user?.setActivity(`with Bun v${Bun.version}`);
  setTimeout(() => client.user?.setActivity(), 60_000);
});
await client.login(env.DISCORD_TOKEN);

const RETRIES = 5;
const RETRY_SECONDS = 10;
function retryEvent<T extends keyof ClientEvents>(
  event: T,
  listener: (...args: ClientEvents[T]) => Awaitable<void>,
) {
  const fn = async (retry = 0, ...args: ClientEvents[T]) => {
    try {
      await listener(...args);
    } catch (error) {
      if (retry < RETRIES) {
        console.warn(
          `Retrying event ${event} in ${RETRY_SECONDS}s (${retry}/${RETRIES}):
> Error for event ${event}: ${error}`,
        );
        setTimeout(async () => fn(retry + 1, ...args), RETRY_SECONDS * 1000);
      } else {
        console.error(`Error caught for event ${event}:`, error);
      }
    }
  };
  client.on(event, (...args) => fn(0, ...args));
}
