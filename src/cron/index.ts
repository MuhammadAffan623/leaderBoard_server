import cron from "node-cron";
import { twitterCron } from "./twitterCron2";
import { createDailyLeaderboard } from "./leaderboard";
import logger from "../utils/logger";
import MetaDataController from "../controller/metaData";

// const cronSchedule = "*/1 * * * * *"; // Runs every second
// const cronSchedule = "0 0 * * *"; // Once at midnight
const cronSchedule = "0 * * * *"; // Run the job at the start of every hour
// let done = false;
export const cronJob = async (): Promise<void> => {
  logger.info("Running cron job");
  const latestMetaData = await MetaDataController().getLatestObj();
  console.log("latestMetaData ==> ", latestMetaData);
  if (!latestMetaData) {
    console.log("latestMetaData not found ==> ", latestMetaData);
    // no data to process on
    return;
  }
  // if (done) return;
  // done = true;
  // cron to update user twitter data
  const result = await twitterCron();
  if (result.success) {
    // run leader board cron
    await createDailyLeaderboard();
  }

  logger.info("Cron job done");
};
const job = cron.schedule(cronSchedule, cronJob);
job.start();

// export default job;
