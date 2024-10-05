import db from "../database";
import { members } from "../drizzle/schema";
import event from "../event";

export default event({ name: "guildMemberAdd" }, async ({ args: [member] }) => {
  await db.insert(members).values({
    id: member.id,
    guildId: member.guild.id,
    bot: member.user.bot,
  });
});
