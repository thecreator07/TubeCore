import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10, sortBy, sortType } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video does not found");
  }

  const pipeline = [];

  pipeline.push(
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $sort: {
        [sortBy || "createdAt"]: sortType === "desc" ? -1 : 1,
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
            $project: { fullName: 1, username: 1, avatar: 1 },
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
        totallikes: {
          $size: "$likes",
        },
        isliked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
        createdAt: {
          $dateToParts: {
            date: "$createdAt",
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        owner: 1,
        totallikes: 1,
        isliked: 1,
        createdAt: {
          year: 1,
          month: 1,
          day: 1,
          hour: 1,
        },
      },
    }
  );

  const skip = (page - 1) * limit;
  pipeline.push({
    $skip: skip,
  });
  pipeline.push({
    $limit: limit,
  });

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const commentAggregate = Comment.aggregate(pipeline);

  const results = await Comment.aggregatePaginate(commentAggregate, options);

  return res
    .status(201)
    .json(new ApiResponse(200, results, "comments are fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(401, "unauthorized videoId");
  }

  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Something went wrong During comment");
  }

  const usercomment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(200, usercomment, "Comment on Video Successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(401, "unauthorized CommentId");
  }

  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Comment have not Updated");
  }
  const updatedcomment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );
  return res
    .status(201)
    .json(new ApiResponse(200, updatedcomment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  const comment = await Comment.findOne({
    _id: commentId,
    owner: req.user?._id,
  });

  if (comment) {
    const deletedcomment = await Comment.deleteOne({ _id: commentId });
    if (!deletedcomment) {
      throw new ApiError(400, "Something went wrong during Deletion");
    }
    return res
      .status(201)
      .json(
        new ApiResponse(201, deletedcomment, "Comment Deleted Successfully")
      );
  }
  return res
    .status(200)
    .json(new ApiResponse(201, comment, "There is No Comment"));
});

export { addComment, updateComment, deleteComment, getVideoComments };
