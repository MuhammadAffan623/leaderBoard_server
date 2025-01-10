import { Schema, model, Document, Types } from "mongoose";

export interface IDailyReward extends Document {
  userId: Types.ObjectId; // References the User schema
  impressionsCount: number;
  tweetCounts: number;
  retweetCounts: number;
  spacesAttendedCount: number;
  telegramMessagesCount: number;
  calculatedReward: number; // for uploading price / reward using csv, only be updated by admin
  createdAt?: Date;
  updatedAt?: Date;
}

const dailyRewardSchema = new Schema<IDailyReward>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    impressionsCount: { type: Number, default: 0 },
    tweetCounts: { type: Number, default: 0 },
    retweetCounts: { type: Number, default: 0 },
    spacesAttendedCount: { type: Number, default: 0 },
    telegramMessagesCount: { type: Number, default: 0 },
    calculatedReward: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DailyReward = model<IDailyReward>(
  "DailyReward",
  dailyRewardSchema
);
// dupliacting for cron cause it wont be updated by admin
export const CronDailyReward = model<IDailyReward>(
  "CronDailyReward",
  dailyRewardSchema
);
