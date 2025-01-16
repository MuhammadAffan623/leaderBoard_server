import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { User } from "../models/user";
import { config } from "./index";

const TWITTER_CONSUMER_KEY = config.twitter_consumer_key;
const TWITTER_CONSUMER_SECRET = config.twitter_consumer_secret;
console.log({ TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET });
if (!TWITTER_CONSUMER_KEY || !TWITTER_CONSUMER_SECRET) {
  throw new Error(
    "Twitter API credentials are missing in environment variables"
  );
}

passport.serializeUser((user: any, done) => {
  console.log("serialize user");
  console.dir(user);
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  console.log("deserialize user", id);

  try {
    const user = await User.findById(id);
    console.log("user === >");
    console.dir(user);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new TwitterStrategy(
    {
      consumerKey: TWITTER_CONSUMER_KEY,
      consumerSecret: TWITTER_CONSUMER_SECRET,
      callbackURL: "http://localhost:5000/api/v1/users/twitterCallback", // be callback url
      //   callbackURL: "http://localhost:5173/twitterSuccess",
    },
    async (token, tokenSecret, profile, done) => {
      try {
        // Check if user exists
        console.log("....");
        console.dir(profile);
        let user = await User.findOne({ twitterId: profile.id });

        if (!user) {
          // Create new user if doesn't exist
          user = await User.create({
            twitterId: profile.id,
            twitterUsername: profile.username,
            profileImage: profile.photos?.[0]?.value || "",
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);
