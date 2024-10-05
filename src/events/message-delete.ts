import db, { eq } from "../database";
import { messages } from "../drizzle/schema";
import event from "../event";

export default event({ name: "messageDelete" }, async ({ args: [message] }) => {
  await db.delete(messages).where(eq(messages.id, message.id));
});
