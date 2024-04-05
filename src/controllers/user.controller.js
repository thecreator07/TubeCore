import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
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

  // Check if User is already exists
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
  console.log(user); //mongoDb database will automatically create _id for user in Db

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
  const options = {
    httpOnly: true, //only server can modify the cookie
    secure: true,
  };

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
  const options = {
    httpOnly: true, //only server can modify the cookie
    secure: true,
  };

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

    const { accessToken, newRefreshtoken } =
      await generateAccesTokenAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshtoken", newRefreshtoken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshtoken },
          "accessToken refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message||"Something went wrong in Refreshing token");
  }
});
export { registerUser, loginUser, logoutUser, getcookie,refreshAccessToken };
