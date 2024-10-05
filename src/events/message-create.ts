import db from "../database";
import { attachments, messages } from "../drizzle/schema";
import event from "../event";

export default event({ name: "messageCreate" }, async ({ args: [message] }) => {
  const messageId = message.id;
  await db.insert(messages).values({
    id: messageId,
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
        messageId,
        filename: attachment.name,
        contentType: attachment.contentType,
        bot: message.author.bot,
        nsfw: "nsfw" in message.channel ? message.channel.nsfw : undefined,
      })),
    );
  }
});
