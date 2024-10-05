import db, { eq } from "../database";
import { messages } from "../drizzle/schema";
import event from "../event";

export default event(
  { name: "messageUpdate" },
  async ({ args: [, message] }) => {
    const msg = message.partial ? await message.fetch() : message;
    await db
      .update(messages)
      .set({
        updatedAt: msg.editedAt,
        content: msg.content,
      })
      .where(eq(messages.id, msg.id));
  },
);
