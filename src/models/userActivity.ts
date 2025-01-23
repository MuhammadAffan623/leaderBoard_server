import { Schema, model, Document, Types } from "mongoose";

export interface IUserActivity extends Document {
  userId: Types.ObjectId;
  tweetIds: string[];
  commentIds: string[];
  spaceAttendedIds: string[];
  telegramSmsIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const userActivitySchema = new Schema<IUserActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tweetIds: [{ type: String }], // also contains retweetIds
    spaceAttendedIds: [{ type: String }],
    commentIds: [{ type: String }],
    telegramSmsIds: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const UserActivity = model<IUserActivity>(
  "UserActivity",
  userActivitySchema
);
