import mongoose from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  console.log(content);
  if (!content) {
    throw new ApiError(400, "There is No content written by User");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user,
  });

  const createdTweet = await Tweet.findById(tweet._id);
  if (!createTweet) {
    throw new ApiError(400);
  }

  res
    .status(201)
    .json(
      new ApiResponse(200, { createdTweet }, "User Tweet Created Successfully")
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "User Does not Exist");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              //   fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $arrayElemAt: ["$owner", 0],
        },
      },
    },
    {
      $project: {
        content: 1,
        owner: 1,
        createdAt: 1,
      },
    },
  ]);
  res
    .status(201)
    .json(new ApiResponse(201, { tweets }, "User All Tweets are fetched"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "unauthorized tweetId");
  }

  const { content } = req.body;

  const tweetUser = await Tweet.findById(tweetId);
  const tweetUserId = new mongoose.Types.ObjectId(tweetUser.owner);
  const userId = new mongoose.Types.ObjectId(req.user._id);
  if (tweetUserId.toString() !== userId.toString()) {
    throw new ApiError(400, "User can't update Tweet");
  }

  const updatedtweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  res
    .status(201)
    .json(new ApiResponse(200, { updatedtweet }, "tweet updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  const tweetUser = await Tweet.findById(tweetId);
  const tweetUserId = new mongoose.Types.ObjectId(tweetUser.owner);
  const userId = new mongoose.Types.ObjectId(req.user._id);
  if (tweetUserId.toString() !== userId.toString()) {
    throw new ApiError(400, "User can't update Tweet");
  }

  const deletedtweet = await Tweet.findByIdAndDelete(tweetId);
  if (!deletedtweet) {
    throw new ApiError(400, "Something went wrong during deletion of tweet");
  }
  
  res.status(201).json(new ApiResponse(200, "Tweet deleted Successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
