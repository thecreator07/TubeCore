import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

  res
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
  res
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
    res
      .status(201)
      .json(
        new ApiResponse(201, deletedcomment, "Comment Deleted Successfully")
      );
  }
  return res
    .status(200)
    .json(new ApiResponse(201, comment, "There is No Comment"));
});

export { addComment, updateComment, deleteComment };
