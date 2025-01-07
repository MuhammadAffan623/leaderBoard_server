import { Schema, model, Document } from "mongoose";

export interface IRewardPrice extends Document {
  // impressions: number;
  // posts: number;
  // comments: number;
  // retweets: number;
  // spacesAttended: number;
  // telegramMessages: number;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const rewardPriceSchema = new Schema<IRewardPrice>(
  {
    // impressions: { type: Number, default: 0 },
    // posts: { type: Number, default: 0 },
    // comments: { type: Number, default: 0 },
    // retweets: { type: Number, default: 0 },
    // spacesAttended: { type: Number, default: 0 },
    // telegramMessages: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const RewardPrice = model<IRewardPrice>(
  "RewardPrice",
  rewardPriceSchema
);
