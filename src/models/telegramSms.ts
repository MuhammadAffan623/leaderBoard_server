import { Schema, model, Document } from "mongoose";

export interface ITelegramSMS extends Document {
  message: string;
  username: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TelegramSmsSchema = new Schema<ITelegramSMS>(
  {
    message: {
      type: String,
    },
    username: {
      type: String,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TelegramSms = model<ITelegramSMS>(
  "TelegramSms",
  TelegramSmsSchema
);
