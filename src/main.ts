import { type Event, type EventListener } from "./event";
import { Client, type ClientEvents } from "discord.js";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { env } from "node:process";

console.log(`⏳ Starting...`);

const client = new Client({
  intents: [
    "Guilds",
    "GuildMembers",
    "GuildMessages",
    "DirectMessages",
    "MessageContent",
  ],
});
export default client;

const eventsPath = new URL("events", import.meta.url).pathname;
await loadDiscordEvents(eventsPath, client);

export async function loadDiscordEvents(dirPath: string, client: Client) {
  const filenames = await readdir(dirPath);
  if (!filenames.length) {
    return;
  }

  for (const filename of filenames) {
    const filePath = path.join(dirPath, filename);
    const {
      default: { name, once, listener },
    } = (await import(filePath)) as {
      default: Event;
    };

    const eventListener = createEventListener(name, client, listener);
    if (once) {
      client.once(name, async (...args) => eventListener(0, ...args));
    } else {
      client.on(name, async (...args) => eventListener(0, ...args));
    }
  }

  console.info(`Loaded ${filenames.length} events`);
}

await client.login(env.DISCORD_TOKEN);

const RETRIES = 5;
const RETRY_SECONDS = 10;
function createEventListener<T extends keyof ClientEvents>(
  name: string,
  client: Client,
  listener: EventListener<T>,
) {
  const fn = async (retry = 0, ...args: ClientEvents[T]) => {
    try {
      await listener({ client, args });
    } catch (error) {
      if (retry < RETRIES) {
        console.warn(
          `Retrying event ${name} in ${RETRY_SECONDS}s (${retry}/${RETRIES}):
> Error for event ${name}: ${error}`,
        );
        setTimeout(async () => fn(retry + 1, ...args), RETRY_SECONDS * 1000);
      } else {
        console.error(`Error caught for event ${name}:`, error);
      }
    }
  };

  return fn;
}
