import db from "../database";
import { channels } from "../drizzle/schema";
import event from "../event";

export default event({ name: "channelCreate" }, async ({ args: [channel] }) => {
  await db.insert(channels).values({
    id: channel.id,
    guildId: channel.guildId,
    nsfw: "nsfw" in channel ? channel.nsfw : undefined,
  });
});
