import { Schema, model, Document, Types } from "mongoose";

export enum LeaderboardTypes {
  Program_Members = "Program Members",
  General_Public = "General Public",
}

export interface ILeaderboard extends Document {
  userId: Types.ObjectId;
  leaderboardType: LeaderboardTypes;
  rank: number;
  score: number;
  metrics: {
    impressionsCount: number;
    tweetsCount: number;
    retweetsCount: number;
    telegramMessagesCount: number;
    spaceAttendedCount: number;
    commentCount: number;
  };
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const leaderboardSchema = new Schema<ILeaderboard>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaderboardType: {
      type: String,
      enum: Object.values(LeaderboardTypes),
      required: true,
    },
    rank: {
      type: Number,
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      index: true,
    },
    metrics: {
      impressionsCount: {
        type: Number,
        default: 0,
      },
      tweetsCount: {
        type: Number,
        default: 0,
      },
      retweetsCount: {
        type: Number,
        default: 0,
      },
      telegramMessagesCount: {
        type: Number,
        default: 0,
      },
      spaceAttendedCount: {
        type: Number,
        default: 0,
      },
      commentCount: {
        type: Number,
        default: 0,
      },
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
leaderboardSchema.index({ leaderboardType: 1, date: 1 });
leaderboardSchema.index({ userId: 1, date: 1 });
leaderboardSchema.index({ leaderboardType: 1, date: 1, score: -1 });
leaderboardSchema.index({ date: 1, score: -1 });

// Model
export const Leaderboard = model<ILeaderboard>(
  "Leaderboard",
  leaderboardSchema
);
