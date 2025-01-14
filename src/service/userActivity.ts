import { UserActivity, IUserActivity } from "../models/userActivity";
import { Types, ClientSession } from "mongoose";

type UserActivityData = {
  tweetIds: string[];
  retweetIds: string[];
  commentIds: string[];
  // spaceAttendedIds: string[];
  // telegram chat ids too
};

const userActivityService = () => {
  const createOrUpdateUserActivity = async (
    userId: Types.ObjectId,
    activityData: UserActivityData,
    session?: ClientSession // Optional session for transactions
  ): Promise<IUserActivity> => {
    try {
      const query = UserActivity.findOne({ userId });
      if (session) query.session(session); // Attach session if provided

      // Check if user activity exists
      const existingActivity = await query.exec();

      if (existingActivity) {
        // Update existing user activity by merging new data
        Object.keys(activityData).forEach((key) => {
          const dataKey = key as keyof UserActivityData;
          if (Array.isArray(activityData[dataKey])) {
            existingActivity[dataKey] = [
              ...(existingActivity[dataKey] as string[]),
              ...activityData[dataKey],
            ];
          }
        });

        // Save with session if provided
        await existingActivity.save({ session });
        return existingActivity;
      } else {
        // Create new user activity
        const newActivity = new UserActivity({
          userId,
          ...activityData,
        });

        // Save with session if provided
        await newActivity.save({ session });
        return newActivity;
      }
    } catch (error) {
      console.error("Error in createOrUpdateUserActivity:", {
        userId,
        activityData,
        error,
      });
      throw new Error("Failed to create or update user activity");
    }
  };

  return {
    createOrUpdateUserActivity,
  };
};

export default userActivityService;
