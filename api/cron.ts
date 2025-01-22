import { Handler } from "@vercel/node";
import runCronJobs from "../src/cron/index"; // Update the path based on your folder structure

const handler: Handler = async (req, res) => {
  try {
    await runCronJobs.start(); // Your cron logic inside the `index.ts` file
    res.status(200).send("Cron job executed successfully!");
  } catch (error) {
    console.error("Cron job error:", error);
    res.status(500).send("Failed to execute cron job.");
  }
};

export default handler;
