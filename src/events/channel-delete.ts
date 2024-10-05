import db, { eq } from "../database";
import { channels } from "../drizzle/schema";
import event from "../event";

export default event({ name: "channelDelete" }, async ({ args: [channel] }) => {
  await db
    .update(channels)
    .set({ deleted: true })
    .where(eq(channels.id, channel.id));
});
