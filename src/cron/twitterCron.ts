import { UserActivity } from "../models/userActivity";
import { IUser, User, USERROLE } from "../models/user";
import twitterService from "../service/twitter";
import { GetUserNewDataReturn, ICreateCron, TotalCounts } from "../types";
import { getDifference, mergeArrays } from "../utils";
import { TweetV2 } from "twitter-api-v2/dist/esm";
import userActivityService from "../service/userActivity";
import mongoose from "mongoose";
import cronDailyRewardService from "../service/cronDailyReward";
import rewardPriceService from "../service/rewardPrice";
import { IRewardPrice } from "../models/rewardPrice";
// import { CronDailyReward } from "../models/dailyReward";

const tweetService = twitterService();
const activityService = userActivityService();
const cronDailyService = cronDailyRewardService();
const rewardService = rewardPriceService();
const processTweetIdsInBatches = async (
  allTweetIds: string[]
): Promise<TweetV2[]> => {
  const BATCH_SIZE = 100; // Number of items per batch
  const PAUSE_DURATION_MS = 60000; // 1 minute in milliseconds

  let allTweetResponses: TweetV2[] = [];

  for (let i = 0; i < allTweetIds.length; i += BATCH_SIZE) {
    // Get the current batch of tweet IDs
    const batch = allTweetIds.slice(i, i + BATCH_SIZE);

    try {
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}`);

      // Call the getTweetsDetail method for the current batch
      const tRes = await tweetService.getTweetsDetail(batch);
      allTweetResponses.push(...tRes);

      // Pause for 1 minute unless it's the last batch
      if (i + BATCH_SIZE < allTweetIds.length) {
        console.log("Pausing for 1 minute...");
        await new Promise((resolve) => setTimeout(resolve, PAUSE_DURATION_MS));
      }
    } catch (error) {
      console.error(
        `Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
        error
      );
      new Error(`Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`);
    }
  }

  return allTweetResponses;
};

export const twitterCron = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const allUsers: IUser[] = await User.find({ role: USERROLE.USER }).lean();
    //   console.log({ allUsers });
    for (const user of allUsers) {
      // console.log("> ",user.fetchDateTime);
      // console.log("> to date string",user.fetchDateTime.toISOString());
      console.log("-------");
      const userActivity = await UserActivity.findOne({ userId: user._id });
      console.log({ userActivity });
      const { newTweets, newRetweet, newComments }: GetUserNewDataReturn =
        await tweetService.getUserNewTweetsData(
          user.id,
          user.fetchDateTime.toISOString()
        );
      console.log("new fetched data");
      console.dir(newTweets);
      console.dir(newRetweet);
      console.dir(newComments);
      console.log("-----------------");
      // get tweetID's from
      const newTweetsIds = newTweets.map((item) => item.id);
      const uniqueTweetIds = await mergeArrays(
        newTweetsIds,
        userActivity?.tweetIds ?? []
      );

      console.log("uniqueTweetIds > ", uniqueTweetIds.length);
      console.dir(uniqueTweetIds);

      // get retweetId's
      const newRetweetIds = newRetweet.map((item) => item.id);
      const uniqueRetweetIds = await mergeArrays(
        newRetweetIds,
        userActivity?.retweetIds ?? []
      );

      console.log("uniqueRetweetIds > ", uniqueRetweetIds.length);
      console.dir(uniqueRetweetIds);

      //get comment id's

      const newCommentIds = newComments.map((item) => item.id);
      const uniqueCommentIds = await mergeArrays(
        newCommentIds,
        userActivity?.commentIds ?? []
      );

      console.log("uniqueCommentIds > ", uniqueCommentIds.length);
      console.dir(uniqueCommentIds);

      const allTweetIds = [
        ...uniqueCommentIds,
        ...uniqueRetweetIds,
        ...uniqueTweetIds,
      ];

      let allTweetResponse = await processTweetIdsInBatches(allTweetIds);
      // calculations
      // Aggregate metrics
      const { impressionsCount, retweetCounts } = allTweetResponse.reduce(
        (acc, item) => {
          acc.impressionsCount += item?.public_metrics?.impression_count ?? 0;
          acc.retweetCounts += item?.public_metrics?.retweet_count ?? 0;
          return acc;
        },
        { impressionsCount: 0, retweetCounts: 0 }
      );

      console.log(`Impressions Count: ${impressionsCount}`);
      console.log(`Retweet Counts: ${retweetCounts}`);

      //
      const totalTweetCount = uniqueTweetIds.length;
      const totalRetweetCount = uniqueRetweetIds.length;
      const totalCommentCount = uniqueCommentIds.length;

      await activityService.createOrUpdateUserActivity(
        user.id,
        {
          tweetIds: uniqueTweetIds,
          retweetIds: uniqueRetweetIds,
          commentIds: uniqueCommentIds,
        },
        session
      );
      let telegramSmsCount = 0; // will implement later
      let spaceAttendedCount = 0; // will implement later
      //calculate reward price
      const latestReward = await rewardService.getLatestPrice();
      if (!latestReward) {
        new Error("no reward price data found ");
      }
      let totalPrice =
        (latestReward?.impressionReward || 0 + impressionsCount) +
        (latestReward?.tweetsReward || 0 + totalTweetCount) +
        (latestReward?.retweetsReward || 0 + totalRetweetCount) +
        (latestReward?.spacesAttendedReward || 0 + spaceAttendedCount) +
        (latestReward?.telegramReward || 0 + telegramSmsCount) +
        (latestReward?.commentReward || 0 + totalCommentCount);

      // update daily cron object
      //   CronDailyReward
      const totalCronRewards: TotalCounts =
        await cronDailyService.getAllCronReward(user._id as string);

      //
      const userDailyReward: ICreateCron = {
        userId: user._id as string,
        impressionsCount: await getDifference(
          totalCronRewards.totalImpressionCount,
          impressionsCount
        ),
        tweetCounts: await getDifference(
          totalCronRewards.totalTweetCount,
          totalTweetCount
        ),
        retweetCounts: await getDifference(
          totalCronRewards.totalRetweetCount,
          totalRetweetCount
        ),
        spacesAttendedCount: 0, //not implemented yet
        telegramMessagesCount: 0, // not implemented yet
        commentCounts: await getDifference(
          totalCronRewards.totalCommentCounts,
          totalCommentCount
        ),
        calculatedReward: await getDifference(
          totalPrice,
          totalCronRewards.totalCalculatedReward
        ),
      };
      await cronDailyService.createCronDailyReward(userDailyReward);
    }
    await session.commitTransaction();
    console.log("Transaction committed successfully.");
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction failed:", error);
  } finally {
    session.endSession();
  }
};
