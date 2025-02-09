import { Schema, model, Document } from "mongoose";

export enum USERROLE {
  ADMIN = "ADMIN",
  USER = "USER",
}
export interface IUser extends Document {
  twitterId: string;
  walletAddress: string;
  telegramId?: string;
  twitterUsername?: string;
  isProgramMember: boolean;
  fetchDateTime: Date;
  createdAt?: Date;
  updatedAt?: Date;
  role: USERROLE;
  isWhiteListed: boolean;
  profileImage: string;
  twitterToken: string;
}

const userSchema = new Schema<IUser>(
  {
    twitterId: { type: String },
    walletAddress: { type: String },
    telegramId: {
      type: String,
      unique: true, // Ensures uniqueness
      sparse: true, // Allows multiple documents with `null` values
      lowercase: true,
    },
    twitterUsername: { type: String },
    profileImage: { type: String },

    isProgramMember: { type: Boolean, default: false },
    fetchDateTime: {
      type: Date,
      required: true,
      default: new Date("1995-01-01"), //update it according to project start time
    },
    isWhiteListed: { type: Boolean, default: false },
    role: {
      type: String,
      default: USERROLE.USER,
      enum: Object.values(USERROLE),
    },
    twitterToken: { type: String, default: null },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
