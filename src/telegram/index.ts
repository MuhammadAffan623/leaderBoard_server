import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
// @ts-ignore
import * as input from "input";
import * as fs from "fs";
import { config } from "../config";
import path from "path";
import { isKeywordinPost } from "../utils";
import telegramService from "../service/telegram";
// Telegram credentials
const apiId: number = config.telegram_api_id;
const apiHash: string = config.telegram_api_hash;
const SESSION_FILE: string = "session.txt";
const teleframPath = path.join(__dirname, SESSION_FILE);
const stringSession = new StringSession(
  fs.existsSync(teleframPath) ? fs.readFileSync(teleframPath, "utf8") : ""
);

const TARGET_GROUP: string = config.telegram_target_group; // Public group name

(async () => {
  const telegramHelper = telegramService();
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  // Start the client and authenticate if necessary
  if (!fs.existsSync(teleframPath)) {
    await client.start({
      phoneNumber: async (): Promise<string> =>
        await input.text("Please enter your number: "),
      phoneCode: async (): Promise<string> =>
        await input.text("Please enter the code you received: "),
      onError: (err: Error) => console.log("Error during authentication:", err),
    });

    // fs.writeFileSync(teleframPath, client.session.save() as any, "utf8");
  } else {
    await client.connect();
  }

  let targetGroupEntity;
  try {
    targetGroupEntity = await client.getEntity(TARGET_GROUP);
  } catch (error) {
    console.error("Error fetching target group entity:", error);
    process.exit(1);
  }

  client.addEventHandler(async (update: any) => {
    try {
      if (update.className === "UpdateNewChannelMessage") {
        const message = update.message;

        if (message && message.fromId?.userId) {
          const userId = message.fromId.userId;
          const sender: any = await client.getEntity(userId);
          const username =
            sender?.username || sender?.firstName || "Unknown User";
          console.log(`@${username}: ${message.message}`);
          // check message contains tardi in it
          // if (isKeywordinPost(message.message)) {
            telegramHelper.incrementUserMessage(message.id, username);
          // }
        }
      }
    } catch (error: any) {
        console.error("Error processing update:", error.message);
    }
  });
})();
