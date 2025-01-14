import { Schema, model, Document, Types } from "mongoose";

export interface IDailyReward extends Document {
  userId: Types.ObjectId; // References the User schema
  impressionsCount: number;
  tweetCounts: number;
  retweetCounts: number;
  commentCounts: number;
  spacesAttendedCount: number;
  telegramMessagesCount: number;
  calculatedReward: number; // for uploading price/reward using csv, only updated by admin
  createdAt?: Date;
  updatedAt?: Date;
}

const dailyRewardSchema = new Schema<IDailyReward>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    impressionsCount: { type: Number, default: 0 },
    tweetCounts: { type: Number, default: 0 },
    retweetCounts: { type: Number, default: 0 },
    commentCounts: { type: Number, default: 0 },
    spacesAttendedCount: { type: Number, default: 0 },
    telegramMessagesCount: { type: Number, default: 0 },
    calculatedReward: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Adding an index on userId for efficient queries
dailyRewardSchema.index({ userId: 1 });

// Create the DailyReward model
export const DailyReward = model<IDailyReward>(
  "DailyReward",
  dailyRewardSchema
);

// Create a separate schema for CronDailyReward to add the middleware
const cronDailyRewardSchema = new Schema<IDailyReward>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    impressionsCount: { type: Number, default: 0 },
    tweetCounts: { type: Number, default: 0 },
    retweetCounts: { type: Number, default: 0 },
    commentCounts: { type: Number, default: 0 },
    spacesAttendedCount: { type: Number, default: 0 },
    telegramMessagesCount: { type: Number, default: 0 },
    calculatedReward: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Add the same index
cronDailyRewardSchema.index({ userId: 1 });

// Add pre-save middleware to sync with DailyReward
cronDailyRewardSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      // Only run on new document creation
      const dailyRewardDoc = new DailyReward({
        userId: this.userId,
        impressionsCount: this.impressionsCount,
        tweetCounts: this.tweetCounts,
        retweetCounts: this.retweetCounts,
        commentCounts: this.commentCounts,
        spacesAttendedCount: this.spacesAttendedCount,
        telegramMessagesCount: this.telegramMessagesCount,
        calculatedReward: this.calculatedReward,
      });

      await dailyRewardDoc.save();
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Create the CronDailyReward model with the enhanced schema
export const CronDailyReward = model<IDailyReward>(
  "CronDailyReward",
  cronDailyRewardSchema
);
