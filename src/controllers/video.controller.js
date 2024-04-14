import { response } from "express";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

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

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video does not found in DB");
  }

  res
    .status(200)
    .json(
      new ApiResponse(201, video.videoFile, "Video have found Successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) {
    throw new ApiError(400, "wrong video Id");
  }
  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(500, "Failed to delete video");
  }

  res.status(200).json(new ApiResponse(201, "Video Deleted Successfully"));
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
  
  res
    .status(200)
    .json(
      new ApiResponse(
        201,
        { updateVideothumbnail },
        "Video Thumbnail uodated Successfully"
      )
    );
});

export { publishAVideo, getVideoById, deleteVideo, updateVideo };
