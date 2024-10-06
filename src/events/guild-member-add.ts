import db, { eq } from "../database";
import { members } from "../drizzle/schema";
import event from "../event";

export default event({ name: "guildMemberAdd" }, async ({ args: [member] }) => {
  const exists = await db.query.members.findFirst({
    columns: { id: true },
    where: eq(members.id, member.id),
  });
  if (exists) {
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
