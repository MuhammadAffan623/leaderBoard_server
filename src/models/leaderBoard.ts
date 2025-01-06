import { Schema, model, Document, Types } from "mongoose";

export interface ILeaderboard extends Document {
  leaderboardType: "Program Members" | "General Public";
  date: Date;
  rankings: Array<{
    userId: Types.ObjectId; // References the User schema
    rewardPoints: number;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

const leaderboardSchema = new Schema<ILeaderboard>(
  {
    leaderboardType: {
      type: String,
      enum: ["Program Members", "General Public"],
      required: true,
    },
    date: { type: Date, default: Date.now },
    rankings: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        rewardPoints: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Leaderboard = model<ILeaderboard>("Leaderboard", leaderboardSchema);
