import cron from "node-cron";
import twitterCron from "./twitterCron2";
// import { twitterCron } from "./twitterCron";

const cronSchedule = "*/1 * * * * *"; // Runs every second
// const cronSchedule = "0 0 * * *"; // Once at midnight
let done = false;
const cronJob = async (): Promise<void> => {
  if (done) return;
  done = true;
  // cron to update user twitter data
  const result = await twitterCron();
  if (result.success) {
    // run leader board cron
  }
};
const job = cron.schedule(cronSchedule, cronJob);
job.start();
