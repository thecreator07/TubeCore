import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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
  //   console.log(user);

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

export { registerUser };
