import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
console.log(content)
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

export { createTweet };
