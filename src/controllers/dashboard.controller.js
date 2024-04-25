import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const stats = await User.aggregate([
    {
      $match: {
        _id: req.user._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              foreignField: "video",
              localField: "_id",
              as: "likes",
            },
          },
          {
            $addFields: {
              videoViews: {
                $sum: "$views",
              },
              videolikes: {
                $size: "$likes",
              },
            },
          },
          {
            $project: {
              videoViews: 1,
              videolikes: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$video.views",
        },
        totalSubscribers: {
          $size: "$subscribers",
        },
        totallikes: {
          $sum: "$videos.videolikes",
        },
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        videos: 1,
        totalVideos: 1,
        totalViews: 1,
        totalSubscribers: 1,
        totallikes: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(201)
    .json(new ApiResponse(200, stats, "Channel Stats fetched Successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const videos = await User.aggregate([
    {
      $match: {
        _id: req.user._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likes",
            },
          },
          {
            $addFields: {
              totallikes: {
                $size: "$likes",
              },
              createdAt: {
                $dateToParts: {
                  date: "$createdAt",
                },
              },
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              isPublished: 1,
              totallikes: 1,
              createdAt: {
                year: 1,
                month: 1,
                day: 1,
                hour: 1,
                minute: 1,
              },
            },
          },
        ],
      },
    },

    {
      $project: {
        videos: 1,
      },
    },
  ]);

  return res
    .status(201)
    .json(new ApiResponse(200, videos, "Channel videos fetched Successfully"));
});

export { getChannelStats, getChannelVideos };
