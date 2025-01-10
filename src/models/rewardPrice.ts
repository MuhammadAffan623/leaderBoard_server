import { Schema, model, Document } from "mongoose";

export interface IRewardPrice extends Document {
  impressionReward: number;
  tweetsReward: number;
  retweetsReward: number;
  spacesAttendedReward: number;
  telegramReward: number;
  // price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const rewardPriceSchema = new Schema<IRewardPrice>(
  {
    impressionReward: { type: Number, default: 0 },
    tweetsReward: { type: Number, default: 0 },
    retweetsReward: { type: Number, default: 0 },
    spacesAttendedReward: { type: Number, default: 0 },
    telegramReward: { type: Number, default: 0 },
    // price: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const RewardPrice = model<IRewardPrice>(
  "RewardPrice",
  rewardPriceSchema
);
