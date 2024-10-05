import db, { eq } from "../database";
import { members } from "../drizzle/schema";
import event from "../event";

export default event(
  { name: "guildMemberUpdate" },
  async ({ args: [, member] }) => {
    await db
      .update(members)
      .set({
        guildId: member.guild.id,
        bot: member.user.bot,
      })
      .where(eq(members.id, member.id));
  },
);
