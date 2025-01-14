import mongoose, { Schema, Document, Model } from "mongoose";

// Define the interface for the Keyword document
export interface IKeyword extends Document {
  keywords: string[];
}

// Define the schema
const KeywordSchema: Schema = new Schema<IKeyword>({
  keywords: {
    type: [String],
    required: true,
    default: [],
  },
});

// Create a model
export const Keyword = mongoose.model<IKeyword>("Keyword", KeywordSchema);
