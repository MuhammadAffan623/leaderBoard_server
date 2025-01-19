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
  twitter_consumer_key: string;
  twitter_consumer_secret: string;
  frontend_url: string;
  backend_url: string;
}

// Initialize the configuration object
export const config: Config = {
  port: parseInt(process.env.PORT || "5000", 10),
  mongo_uri: process.env.MONGO_URI || "",
  jwt_secret: process.env.JWT_SECRET || "",
  twitter_consumer_key: process.env.TWITTER_CONSUMER_KEY || "",
  twitter_consumer_secret: process.env.TWITTER_CONSUMER_SECRET || "",
  frontend_url: process.env.FRONTEND_URL || "",
  backend_url: process.env.BACKEND_URL || "",
};

// Function to get the Twitter client
export const getTwitterClient = (): TwitterApiReadOnly => twitterClient;
