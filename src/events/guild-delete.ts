import db, { eq } from "../database";
import { guilds } from "../drizzle/schema";
import event from "../event";

export default event({ name: "guildDelete" }, async ({ args: [guild] }) => {
  await db.update(guilds).set({ deleted: true }).where(eq(guilds.id, guild.id));
});
