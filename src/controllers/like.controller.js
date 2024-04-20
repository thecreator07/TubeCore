import mongoose from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const liked = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });
  if (liked) {
    const dislike = await Like.deleteOne({ _id: liked._id });
    if (!dislike) {
      throw new ApiError(400, "Can't Dislike the video");
    }
    return res
      .status(201)
      .json(new ApiResponse(200, dislike, "Video Disliked Successfully"));
  }

  const likedByUser = await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });

  if (!likedByUser) {
    throw new ApiError(400, "video like UnSuccessful");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, likedByUser, "Video Liked Successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on video
  const liked = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });
  if (liked) {
    const dislike = await Like.deleteOne({ _id: liked._id });
    if (!dislike) {
      throw new ApiError(400, "Can't Dislike the comment");
    }
    return res
      .status(201)
      .json(new ApiResponse(200, dislike, "comment Disliked Successfully"));
  }

  const likedByUser = await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (!likedByUser) {
    throw new ApiError(400, "comment like UnSuccessful");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, likedByUser, "comment Liked Successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on video
  const liked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });
  if (liked) {
    const dislike = await Like.deleteOne({ _id: liked._id });
    if (!dislike) {
      throw new ApiError(400, "Can't Dislike the tweet");
    }
    return res
      .status(201)
      .json(new ApiResponse(200, dislike, "tweet Disliked Successfully"));
  }

  const likedByUser = await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (!likedByUser) {
    throw new ApiError(400, "tweet like UnSuccessful");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, likedByUser, "tweet Liked Successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const videos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    // {
    //   $project: {
    //     video: 1,
    //   },
    // },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "userDetails", // Renamed to avoid conflict
              pipeline: [
                {
                  $project: {
                    _id: 0,
                    fullName: 1,
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
                $first: "$userDetails", // Assuming single owner
              },
            },
          },
         
        ],
      },
    },
    {
      $unwind: "$video",
    },
    {
      $sort: {
        createdAt: -1, //this will sort the video by Createdtime
      },
    },
    {
      $project: {
        _id: 0,
        video: {
          _id: 1,
          videoFile: 1,
          title: 1,
          thumbnail: 1,
          owner: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
        },
      },
    },
  ]);
  console.log(videos);
  return res
    .status(201)
    .json(
      new ApiResponse(200, videos, "All liked videos are Fetched Successfully")
    );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
