import db, { eq } from "../database";
import { messages } from "../drizzle/schema";
import event from "../event";

export default event({ name: "messageDelete" }, async ({ args: [message] }) => {
  await db
    .update(messages)
    .set({ deleted: true })
    .where(eq(messages.id, message.id));
});
