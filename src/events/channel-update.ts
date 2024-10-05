import db, { eq } from "../database";
import { channels } from "../drizzle/schema";
import event from "../event";

export default event(
  { name: "channelUpdate" },
  async ({ args: [, channel] }) => {
    await db
      .update(channels)
      .set({
        nsfw: "nsfw" in channel ? channel.nsfw : undefined,
      })
      .where(eq(channels.id, channel.id));
  },
);
