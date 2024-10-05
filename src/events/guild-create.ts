import db from "../database";
import { guilds } from "../drizzle/schema";
import event from "../event";

export default event({ name: "guildCreate" }, async ({ args: [guild] }) => {
  await db.insert(guilds).values({
    id: guild.id,
  });
});
