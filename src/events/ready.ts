import event from "../event";

export default event({ name: "ready", once: true }, async ({ client }) => {
  console.log(`✅ ready!`);
  client.user?.setActivity(`with Bun v${Bun.version}`);
  setTimeout(() => client.user?.setActivity(), 60_000);
});
