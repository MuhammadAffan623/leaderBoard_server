import { TweetV2 } from "twitter-api-v2/dist/esm";
import { getTwitterClient } from "../config";
import moment from "moment";
import { isKeywordinPost } from "../utils";
import { GetUserNewDataReturn } from "index";

const twitterService = () => {
  const twitterClient = getTwitterClient();
  // not add tweetId more than 100
  const getTweetsDetail = async (tweetId: string[]): Promise<TweetV2[]> => {
    try {
      const tweet = await twitterClient.v2.tweets(tweetId, {
        "tweet.fields": ["public_metrics"],
      });

      return tweet.data;
    } catch (error: any) {
      console.log(error);
      console.error("Error fetching tweet details:", error.message);
      throw new Error(`Failed to fetch tweet details: ${error.message}`);
    }
  };
  // returns user activity like RT, Tweet, Comment with their public metric that contain like count , impression count and retweet count
  const getUserNewTweets = async (
    userId: string,
    date: string
  ): Promise<TweetV2[]> => {
    try {
      console.log("userId", userId);
      const startTime = moment(date).toISOString();
      console.log("startTime", startTime);
      const tweetsResponse = await twitterClient.v2.userTimeline(userId, {
        "tweet.fields":
          "in_reply_to_user_id,referenced_tweets,created_at,text,public_metrics",
        start_time: startTime,
      });
      return tweetsResponse?.data?.data || [];
    } catch (error: any) {
      console.log(error);
      console.error("Error fetching user tweets:", error.message);
      throw new Error(`Failed to fetch user tweets: ${error.message}`);
    }
  };

  const getUserNewTweetsData = async (
    userId: string,
    startTime: string
  ): Promise<GetUserNewDataReturn> => {
    const newData: TweetV2[] = await getUserNewTweets(userId, startTime);
    let newTweets: TweetV2[] = [];
    let newRetweet: TweetV2[] = [];
    let newComments: TweetV2[] = [];
    for (const tweet of newData) {
      if (
        tweet?.referenced_tweets?.[0]?.type === "replied_to" &&
        tweet?.in_reply_to_user_id &&
        isKeywordinPost(tweet.text)
      ) {
        newComments.push(tweet);
      } else if (
        tweet?.referenced_tweets?.[0]?.type === "retweeted" &&
        isKeywordinPost(tweet.text)
      ) {
        newRetweet.push(tweet);
      } else if (isKeywordinPost(tweet.text)) {
        newTweets.push(tweet);
      }
    }
    return {
      newTweets,
      newRetweet,
      newComments,
    };
  };

  return { getUserNewTweets, getTweetsDetail, getUserNewTweetsData };
};

export default twitterService;
