import { Schema, model, Document } from "mongoose";

export interface IMetadata extends Document {
  fetchDate: Date;
  leaderBoardCreation: Date;
}

const metadataSchema = new Schema<IMetadata>(
  {
    fetchDate: {
      type: Date,
      required: true,
      default: new Date("2025-01-01"), //update it according to project start time
    },
    leaderBoardCreation: {
      type: Date,
      required: true,
      default: new Date("2025-01-01"), //update it according to project start time
    },
  },
  { timestamps: true }
);

export const MetaData = model<IMetadata>("MetaData", metadataSchema);
