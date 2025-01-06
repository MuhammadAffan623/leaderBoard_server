import { Schema, model, Document, Types } from "mongoose";

export interface IDailyReward extends Document {
  userId: Types.ObjectId; // References the User schema
  date: Date;
  impressions: number;
  posts: number;
  comments: number;
  retweets: number;
  spacesAttended: number;
  telegramMessages: number;
  leaderboardType?: "Program Members" | "General Public";
  rewardPoints: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const dailyRewardSchema = new Schema<IDailyReward>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    impressions: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    retweets: { type: Number, default: 0 },
    spacesAttended: { type: Number, default: 0 },
    telegramMessages: { type: Number, default: 0 },
    leaderboardType: {
      type: String,
      enum: ["Program Members", "General Public"],
    },
    rewardPoints: { type: Number, default: 0 },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Ensure one record per user per day
dailyRewardSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyReward = model<IDailyReward>(
  "DailyReward",
  dailyRewardSchema
);
