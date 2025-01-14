import { IRewardPrice, RewardPrice } from "../models/rewardPrice";

const rewardPriceService = () => {
  const getLatestPrice = async (): Promise<IRewardPrice | null> => {
    try {
      const latestPrice = await RewardPrice.find()
        .sort({ createdAt: -1 })
        .limit(1);
      return latestPrice.length > 0 ? latestPrice[0] : null;
    } catch (error) {
      console.error("Error fetching the latest reward price:", error);
      throw new Error("Failed to fetch the latest reward price");
    }
  };

  return {
    getLatestPrice,
  };
};

export default rewardPriceService;
