import { Schema, model, Document, Types } from "mongoose";

export enum LeaderboardTypes {
  Program_Members = "Program Members",
  General_Public = "General Public",
}
export interface ILeaderboard extends Document {
  leaderboardType: LeaderboardTypes;
  rankings: Array<{
    userId: Types.ObjectId; // References the User schema
    score: number;
    totalImpressions: number;
    totalTweets: number;
    totalRetweets: number;
    totalTelegramMessage: number;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

const leaderboardSchema = new Schema<ILeaderboard>(
  {
    leaderboardType: {
      type: String,
      enum: Object.values(LeaderboardTypes),
      required: true,
    },
    rankings: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        score: { type: Number, required: true },
        totalImpressions: { type: Number, required: true },
        totalTweets: { type: Number, required: true },
        totalRetweets: { type: Number, required: true },
        totalTelegramMessage: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Leaderboard = model<ILeaderboard>(
  "Leaderboard",
  leaderboardSchema
);
