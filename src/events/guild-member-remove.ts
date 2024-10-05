import db, { eq } from "../database";
import { members } from "../drizzle/schema";
import event from "../event";

export default event(
  { name: "guildMemberRemove" },
  async ({ args: [member] }) => {
    await db
      .update(members)
      .set({ removed: true })
      .where(eq(members.id, member.id));
  },
);
