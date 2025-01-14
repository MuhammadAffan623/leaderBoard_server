import dotenv from "dotenv";
import { TwitterApi, TwitterApiReadOnly } from "twitter-api-v2";
dotenv.config();

if (!process.env.TWITTER_TOKEN) {
  throw new Error("TWITTER_TOKEN is not defined in environment variables");
}

// Create a Twitter API client instance
const twitterClient: TwitterApiReadOnly = new TwitterApi(
  process.env.TWITTER_TOKEN
).readOnly;

// Define the configuration object type
interface Config {
  port: number;
  mongo_uri: string;
  jwt_secret: string;
}

// Initialize the configuration object
export const config: Config = {
  port: parseInt(process.env.PORT || "5000", 10),
  mongo_uri: process.env.MONGO_URI || "",
  jwt_secret: process.env.JWT_SECRET || "",
};

// Function to get the Twitter client
export const getTwitterClient = (): TwitterApiReadOnly => twitterClient;
