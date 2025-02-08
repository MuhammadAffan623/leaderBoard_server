import { TelegramSms } from "../models/telegramSms";

const telegramSMSService = () => {
  const createSms = async (username: string, message: string) => {
    try {
      const newTelegramSms = await TelegramSms.create({ message, username });
      return newTelegramSms; // Returning the created document
    } catch (error) {
      console.error("Error creating Telegram SMS:", error);
      throw new Error("Failed to create Telegram SMS");
    }
  };

  return {
    createSms,
  };
};

export default telegramSMSService;
