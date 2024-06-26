import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { response } from "express";
const generateAccesTokenAndRefreshToken = async (userId) => {
  try {
    // console.log(userId);
    const user = await User.findById(userId);
    // console.log(user)
    //generateAccesToken() and generateRefreshToken methods are defined in userSchema
    const accessToken = await user.generateAccesToken();
    const refreshToken = await user.generateRefreshToken();
    // console.log(accessToken);
    // console.log(refreshToken);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refreshToken and access Token"
    );
  }
};

const options = {
  httpOnly: true, //only server can modify the cookie
  secure: true,
};

// register controller will handle the registration of new user in DataBase
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { fullName, email, password, username } = req.body;
  console.log("fullName", fullName);

  //check for Validation
  if (
    //this condition will check every field(fullname,email,...) for empty ""
    //  if any of the four will have empty field it will throw error
    [fullName, email, password, username].some((field) => field?.trim() == "")
  )
    throw new ApiError(401, "All field are Required");

  // Check if User is already exists in DB
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) throw new ApiError(409, "Email and username has been used!");

  //   console.log(req.files);
  //Check for Image & Avatar in LocalFile
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   coverImagePath = req.files?.coverImage[0]?.path;

  let coverImagePath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagePath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //Upload avatar to the cloudinary.com
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const CoverImage = await uploadOnCloudinary(coverImagePath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  //   console.log(avatar);

  //Create user Object for Database
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: CoverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  // console.log(user); //mongoDb database will automatically create _id for user in Db

  //Remove Password & Refresh token from DB
  //findOne() will find user Prebuilt _id to remove password and refreshtoken
  const createdUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );
  //   console.log(createdUser);

  //Check for User Creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong during registring User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfuly"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(401, `All fields are Required`);
  }
  //now getting access in database using email or username
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  console.log(email);
  // isPasswordCorrect is a method in User model
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "password is wrong");
  }
  // console.log(user)
  //accestoken and refreshtoken are created
  const { accessToken, refreshToken } = await generateAccesTokenAndRefreshToken(
    user._id
  );
  // console.log(user)
  // const refreshT = await accessToken;
  // const accessT = await refreshToken;
  // delete password and refreshToken from User DataBase
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // console.log(loggedInUser)

  // send cookies and json responce to the user
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Successfully logged In"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // this function will search by _id in database and will update with new value(undefined) in Database
  await User.findByIdAndUpdate(
    req.user._id,
    {
      // $set: {
      //   refreshToken: undefined,
      // },
      $unset: {
        refreshToken: 1, // this will remove the field from the user
      },
    },
    {
      new: true,
    }
  );

  // console.log(req.user);
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  console.log(req.cookies);
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unathorized request");
  }
  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }

    const { accessToken, refreshToken } =
      await generateAccesTokenAndRefreshToken(user._id);
    // console.log(newRefreshtoken)
    const newRefreshtoken = refreshToken;
    return (
      res
        .status(200)
        // .clearCookie("refreshToken", options)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshtoken", newRefreshtoken, options)
        .json(
          new ApiResponse(
            200,
            { accessToken, refreshToken: newRefreshtoken },
            "accessToken refreshed successfully"
          )
        )
    );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Something went wrong in Refreshing token"
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id); //req.user is coming from auth.middleware

  const PasswordCorrect = await user.isPasswordCorrect(oldPassword);
  // console.log(isPasswordCorrect)
  if (!PasswordCorrect) {
    throw new ApiError(402, "Wrong Password !!");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { newPassword }, "Password change Successfully")
    );
});

const currentuser = asyncHandler(async (req, res) => {
  // console.log(req.user)
  // const data=req.user
  res
    .status(200)
    .json(new ApiResponse(201, req.user, "Current User Fetched Successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { username, email } = req.body;

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // const user = await User.findById(req.user?._id);
  // user.username = username;
  // user.email = email;
  // user.avatar = avatar?.url || "";
  // await user.save({ validateBeforeSave: false });
  // const updatedUser = await User.findById(req.user?._id);

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        email,
        avatar: avatar?.url || "",
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, { updatedUser }, "User updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarlocalPath = req.file?.path;
  if (!avatarlocalPath) {
    throw new ApiError(400, "avatar file missing");
  }

  const avatar = await uploadOnCloudinary(avatarlocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while updating Avatar of user");
  }

  const oldAvatar = req.user?.avatar;
  console.log("oldavatar has found", oldAvatar);
  if (!oldAvatar) {
    throw new ApiError(400, "Old Avatar file fetch Unsuccessful");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url || "",
      },
    },
    { new: true }
  ).select("-password");

  await deleteFromCloudinary(oldAvatar);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { updatedUser }, "User Avatar updated successfully")
    );
});

const updatecoverImage = asyncHandler(async (req, res) => {
  const coverImagelocalPath = req.file?.path;
  if (!coverImagelocalPath) {
    throw new ApiError(400, "coverImage file missing");
  }

  const coverImage = await uploadOnCloudinary(coverImagelocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while updating coverImage of user");
  }

  const oldcoverImage = req.user?.coverImage;
  // console.log("oldcoverImage has found", oldcoverImage);
  if (!oldcoverImage) {
    throw new ApiError(400, "Old coverImage file fetch Unsuccessful");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url || "",
      },
    },
    { new: true }
  ).select("-password");

  await deleteFromCloudinary(oldcoverImage);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedUser },
        "User coverImage updated successfully"
      )
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  console.log(username);
  if (!username) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
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
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
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
        email: 1,
        avatar: 1,
        subscribersCount: 1,
        channelsubscribedToCount: 1,
        isSubscribed: 1,
        coverImage: 1,
      },
    },
  ]);
  console.log(channel);

  if (!channel?.length) {
    throw new ApiError(400, "channel does not exist");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched Successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
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
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  console.log(user)
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watchHistory fetched Successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  currentuser,
  updateUserDetails,
  updateAvatar,
  updatecoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
