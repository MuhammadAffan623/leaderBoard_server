import { Request } from "express";
import { IUser } from "../models/user";
import { TweetV2 } from "twitter-api-v2/dist/esm";

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
  retweetIds: string[];
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
  totalCommentCounts: number
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
