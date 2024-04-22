import { Subscription } from "../models/subscription.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose";

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!(title || description)) {
    throw new ApiError(401, "title and description are Required");
  }

  const localVideofilePath = req.files?.videoFile[0].path;
  if (!localVideofilePath) {
    throw new ApiError(402, "videoFile is required");
  }

  const localThumbnailfilePath = req.files.thumbnail[0].path;
  if (!localThumbnailfilePath) {
    throw new ApiError(401, "thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(localVideofilePath);
  const thumbnail = await uploadOnCloudinary(localThumbnailfilePath);

  if (!(videoFile || thumbnail)) {
    throw new ApiError(
      400,
      "Something went wrong during video and thumbnail upload on cloudinary"
    );
  }
  //   console.log(thumbnail);
  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: req.user._id,
    title,
    description,
    duration: videoFile.duration,
    isPublished: true,
  });

  const createdvideo = await Video.findById(video._id);

  if (!createdvideo) {
    throw new ApiError(401, "Something went wrong during video upload");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, createdvideo, "Video Uploaded Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId) {
    throw new ApiError(400, "wrong video params");
  }

  const isvideo = await Video.findById(videoId);
  if (!isvideo) {
    throw new ApiError(400, "video does not found in DB");
  }

  const video = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) }, //fetch video by id
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails", //video owner details (channel details)
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers", // fetch all subscribers of channel
            },
          },
          {
            $addFields: {
              SubscribersCount: {
                $size: "$subscribers",
              },
              IsSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              SubscribersCount: 1,
              IsSubscribed: 1,
            },
          },
        ],
      },
    },
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
        likesCount: {
          $size: "$likes",
        },
        Isliked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
        owner: {
          $first: "$ownerDetails",
        },
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
        owner: 1,
        likesCount: 1,
        Isliked: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(201, video, "Video have found Successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) {
    throw new ApiError(400, "wrong video Id");
  }

  const videotobedeleted = await Video.findById(videoId);
  await deleteFromCloudinary(videotobedeleted.videoFile);
  await deleteFromCloudinary(videotobedeleted.thumbnail);

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(500, "Failed to delete video");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "Video Deleted Successfully"));
});
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!videoId) {
    throw new ApiError(400, "wrong video Id");
  }

  const { title, description } = req.body;

  if (!(title || description)) {
    throw new ApiError(401, "title and description are required");
  }

  let thumbnaillocalpath;
  if (req.file && req.file.path) {
    thumbnaillocalpath = req.file.path;
  }

  const thumbnail = await uploadOnCloudinary(thumbnaillocalpath);
  if (!thumbnail) {
    throw new ApiError(400, "Error during Updating thumbnail of video");
  }

  const oldthumbnail = await Video.findById(videoId);

  const updateVideothumbnail = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  await deleteFromCloudinary(oldthumbnail.thumbnail);

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        { updateVideothumbnail },
        "Video Thumbnail uodated Successfully"
      )
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid ObjectId");
  }

  const published = await Video.findOne({ _id: videoId, owner: req.user?._id });
  // console.log(published);
  if (!published) {
    throw new ApiError(400, "video not found");
  }
  const isPublished = published.isPublished;
  const statuschange = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !isPublished,
      },
    },
    { new: true }
  );
  return res
    .status(201)
    .json(
      new ApiResponse(200, { statuschange }, "Video Status Change successfully")
    );
});

export {
  publishAVideo,
  getVideoById,
  deleteVideo,
  updateVideo,
  togglePublishStatus,
};
