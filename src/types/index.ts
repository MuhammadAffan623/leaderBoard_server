import { Request } from "express";
import { IUser } from "../models/user";
import { TweetV2 } from "twitter-api-v2/dist/esm";
import { LeaderboardTypes } from "../models/leaderBoard";

export interface CustomRequest extends Request {
  userId?: string;
  user: IUser;
}

export interface PaginatedResponse<T> {
  meta: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
  };
  data: T[];
}

export type GetUserNewDataReturn = {
  newTweets: TweetV2[];
  newRetweet: TweetV2[];
  newComments: TweetV2[];
};

export type UserActivityData = {
  tweetIds: string[];
  commentIds: string[];
  spaceAttendedIds: string[];
};

export interface TotalCounts {
  totalImpressionCount: number;
  totalTweetCount: number;
  totalRetweetCount: number;
  totalSpacesAttendedCount: number;
  totalTelegramMessagesCount: number;
  totalCalculatedReward: number;
  totalCommentCounts: number;
}

export interface ICreateCron {
  userId: string;
  impressionsCount: number;
  tweetCounts: number;
  retweetCounts: number;
  spacesAttendedCount: number;
  telegramMessagesCount: number;
  calculatedReward: number;
  commentCounts: number;
}

interface LeaderboardMetrics {
  impressionsCount: number;
  tweetsCount: number;
  retweetsCount: number;
  telegramMessagesCount: number;
  spaceAttendedCount: number;
  commentCount: number;
}
export interface CreateLeaderboardObject {
  userId: string;
  leaderboardType: LeaderboardTypes;
  rank: number;
  score: number;
  metrics: LeaderboardMetrics;
  date: Date;
}
