import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  twitterId: string;
  walletAddress: string;
  telegramId?: string;
  isProgramMember: boolean;
  programJoinedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    twitterId: { type: String, required: true, unique: true },
    walletAddress: { type: String, required: true, unique: true },
    telegramId: { type: String },
    isProgramMember: { type: Boolean, default: false },
    programJoinedAt: { type: Date },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

export const User = model<IUser>("User", userSchema);
