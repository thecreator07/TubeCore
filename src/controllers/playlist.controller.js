import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Playlist } from "../models/playlist.models.js";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  if (!(name || description)) {
    throw new ApiError(400, "Name And Description of video are required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(400, "Something went wrong During Creating Playlist");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, { playlist }, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "userId is not valid");
  }

  const playlist = await Playlist.findOne({ owner: userId });
  if (!playlist) {
    throw new ApiError(400, "No playlists found for this User");
  }

  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "videos",
        as: "userVideos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$userVideos",
        },
        totalViews: {
          $sum: "$userVideos.views",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!userPlaylists) {
    throw new ApiError(400, "Can't Access playlist");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        userPlaylists,
        "User playlist are fetched Successfully"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlistId is not valid");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
          {
            $project: {
              _id: 1,
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              createdAt: 1,
              isPublished: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$ownerDetails",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        owner: 1,
        videos: 1,
      },
    },
  ]);
  if (!playlist) {
    throw new ApiError(400, "Playlist not found");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, playlist, "Playlist found Successfully "));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!(isValidObjectId(playlistId) || isValidObjectId(videoId))) {
    throw new ApiError(400, "playlistId and videoId are Invalid");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Playlist does not found");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video doesn't found");
  }

  const addVideo = await Playlist.findByIdAndUpdate(
    { _id: playlistId },
    { $push: { videos: videoId } },
    { new: true, upsert: true } // Return the updated document, create if playlist not found(upsert:true)
  );

  return res
    .status(201)
    .json(
      new ApiResponse(200, addVideo, "New Video Add in Playlist Successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  if (!(isValidObjectId(playlistId) || isValidObjectId(videoId))) {
    throw new ApiError(400, "playlistId and videoId are Invalid");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Playlist does not found");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video doesn't found");
  }

  const removeVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        removeVideo,
        "Video removed from Playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlistId is Invalid");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Playlist does not found");
  }

  const deletedplaylist = await Playlist.deleteOne({ _id: playlistId });

  if (!deletedplaylist) {
    throw new ApiError(400, "Somrthing went wrong During Deletion of playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedplaylist, "Playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlistId is Invalid");
  }

  if (!(name || description)) {
    throw new ApiError(400, "Name And Description of video are required");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "Something went wrong during updation of Playlist");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, updatedPlaylist, "playlist Updated Successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
