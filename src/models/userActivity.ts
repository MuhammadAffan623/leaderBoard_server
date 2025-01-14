import { Schema, model, Document, Types } from "mongoose";

export interface IUserActivity extends Document {
  userId: Types.ObjectId;
  tweetIds: string[];
  retweetIds: string[];
  commentIds: string[];
  spaceAttendedIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const userActivitySchema = new Schema<IUserActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tweetIds: [{ type: String }],
    retweetIds: [{ type: String }],
    spaceAttendedIds: [{ type: String }],
    commentIds: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const UserActivity = model<IUserActivity>(
  "UserActivity",
  userActivitySchema
);
