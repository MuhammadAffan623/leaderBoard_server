import { UserActivity } from "../models/userActivity";
import { IUser, User, USERROLE } from "../models/user";
import twitterService from "../service/twitter";
import { GetUserNewDataReturn, ICreateCron, TotalCounts } from "../types";
import { getDifference, mergeArrays } from "../utils";
import { TweetV2 } from "twitter-api-v2/dist/esm";
import userActivityService from "../service/userActivity";
import mongoose, { Types } from "mongoose";
import cronDailyRewardService from "../service/cronDailyReward";
import rewardPriceService from "../service/rewardPrice";
import logger from "../utils/logger";
import * as fs from "fs";
import MetaDataController from "../controller/metaData";

const tweetService = twitterService();
const activityService = userActivityService();
const cronDailyService = cronDailyRewardService();
const rewardService = rewardPriceService();

// Helper function to process tweets in batches
const processTweetIdsInBatches = async (
  allTweetIds: string[]
): Promise<TweetV2[]> => {
  const BATCH_SIZE = 100;
  const PAUSE_DURATION_MS = 60000;

  let allTweetResponses: TweetV2[] = [];

  for (let i = 0; i < allTweetIds.length; i += BATCH_SIZE) {
    const batch = allTweetIds.slice(i, i + BATCH_SIZE);

    try {
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}`);
      const tRes = await tweetService.getTweetsDetail(batch);
      allTweetResponses.push(...tRes);

      if (i + BATCH_SIZE < allTweetIds.length) {
        console.log("Pausing for 1 minute...");
        // await new Promise((resolve) => setTimeout(resolve, PAUSE_DURATION_MS));
      }
    } catch (error) {
      logger.error(
        `Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
        error
      );
      logger.error(error);
      throw new Error(
        `Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}`
      );
    }
  }

  return allTweetResponses;
};

// Process individual user data
const processUserData = async (user: IUser): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(`Processing user: ${user._id}`);
    const userActivity = await UserActivity.findOne({ userId: user._id });
    const latestMetaData = await MetaDataController().getLatestObj();
    if (!latestMetaData) return;
    const isFirstFetch =
      user.fetchDateTime.getTime() === new Date("1995-01-01").getTime();

    console.log("isFirstFetch >> ", isFirstFetch);
    const { newTweets, newRetweet, newComments, token }: GetUserNewDataReturn =
      await tweetService.getUserNewTweetsData(
        user.twitterId,
        isFirstFetch
          ? latestMetaData.fetchDate.toISOString()
          : user.fetchDateTime.toISOString(),
        user?.twitterToken || ""
      );
    // fs.writeFileSync(
    //   "./sample2.txt",
    //   JSON.stringify({ newTweets, newRetweet, newComments }, null, 2)
    // );

    // Process tweet IDs
    const newTweetsIds = newTweets.map((item) => item.id);
    const newRetweetIds = newRetweet.map((item) => item.id);
    const uniqueTweetIds = await mergeArrays(
      [...newTweetsIds], //ig remove retweet
      userActivity?.tweetIds ?? []
    );

    // Process comment IDs
    const newCommentIds = newComments.map((item) => item.id);
    const uniqueCommentIds = await mergeArrays(
      newCommentIds,
      userActivity?.commentIds ?? []
    );

    const uniqueRetweetIds = await mergeArrays(
      newRetweetIds,
      userActivity?.retweetIds ?? []
    );

    const allTweetIds = [...uniqueCommentIds, ...uniqueTweetIds];
    const allTweetResponse = await processTweetIdsInBatches(allTweetIds);
    // Assuming `allTweetResponse` is an array of tweet objects, stringify it for proper formatting
    // fs.writeFileSync("./sample.txt", JSON.stringify(allTweetResponse, null, 2));

    // Calculate metrics
    const { impressionsCount } = allTweetResponse.reduce(
      (acc, item) => ({
        impressionsCount:
          acc.impressionsCount + (item?.public_metrics?.impression_count ?? 0),
        // SUM of - all tweets having there own retweets // tardi tweet
        // retweetCounts:
        //   acc.retweetCounts + (item?.public_metrics?.retweet_count ?? 0),
        // commentRecieved:
        //   acc.commentRecieved + (item?.public_metrics?.reply_count ?? 0),
      }),
      { impressionsCount: 0 }
    );

    const totalTweetCount = uniqueTweetIds.length;

    // Update user activity
    await activityService.createOrUpdateUserActivity(
      user._id as string,
      {
        tweetIds: uniqueTweetIds,
        commentIds: uniqueCommentIds,
        retweetIds: uniqueRetweetIds,
      },
      session
    );

    // Calculate rewards
    const latestReward = await rewardService.getLatestPrice();
    if (!latestReward) {
      throw new Error("No reward price data found");
    }

    // const totalPrice =
    // (latestReward.impressionReward || 0) * impressionsCount +
    // (latestReward.tweetsReward || 0) * totalTweetCount +
    // (latestReward.retweetsReward || 0) * retweetCounts +
    // (latestReward.commentReward || 0) * uniqueCommentIds?.length;
    const userTotalCronRewards: TotalCounts =
      await cronDailyService.getAllCronReward(user._id as string);
    const newimpressionsCount = Math.max(
      0,
      impressionsCount - userTotalCronRewards.totalImpressionCount
    );
    // const newimpressionsCount: number = await getDifference(
    //   userTotalCronRewards.totalImpressionCount,
    //   impressionsCount
    // );
    console.log("total latest : ", userTotalCronRewards.totalImpressionCount);
    console.log("impressionCount", impressionsCount);
    console.log("newimpressionsCount >> ", newimpressionsCount);
    const newtweetCounts: number = await getDifference(
      userTotalCronRewards.totalTweetCount,
      totalTweetCount
    );
    const newretweetCounts: number = await getDifference(
      userTotalCronRewards.totalRetweetCount,
      uniqueRetweetIds?.length
    );
    const newcommentCounts: number = await getDifference(
      userTotalCronRewards.totalCommentCounts,
      uniqueCommentIds?.length
    );
    const newcalculatedReward =
      (latestReward.impressionReward || 0) * newimpressionsCount +
      (latestReward.tweetsReward || 0) * newtweetCounts +
      (latestReward.retweetsReward || 0) * newretweetCounts +
      (latestReward.commentReward || 0) * newcommentCounts;
    const userDailyReward: ICreateCron = {
      userId: user._id as string,
      impressionsCount: newimpressionsCount,
      tweetCounts: newtweetCounts,
      retweetCounts: newretweetCounts,
      spacesAttendedCount: 0,
      telegramMessagesCount: 0,
      commentCounts: newcommentCounts,
      calculatedReward: newcalculatedReward,
    };

    await cronDailyService.createCronDailyReward(userDailyReward, session);
    await User.findByIdAndUpdate(
      user._id,
      { $set: { fetchDateTime: new Date(), twitterToken: token } },
      { new: true }
    );
    await session.commitTransaction();
    logger.info(`Successfully processed user: ${user._id}`);
  } catch (error) {
    logger.error(error);
    await session.abortTransaction();
    console.error(`Error processing user ${user.id}:`, error);
    throw error;
  } finally {
    await session.endSession();
  }
};

// Main cron function
export const twitterCron = async () => {
  console.log("Starting Twitter cron job...");

  try {
    const allUsers: IUser[] = await User.find({ role: USERROLE.USER }).lean();
    console.log(`Found ${allUsers.length} users to process`);
    // let count = false;
    for (const user of allUsers) {
      // if (count) break;
      // count = true;
      if (user?.twitterId) {
        await processUserData(user);
      }
    }

    // Return processing results
    return {
      success: true,
    };
  } catch (error) {
    logger.error("Critical error in Twitter cron job:", error);
    logger.error(error);
    throw error;
  }
};
