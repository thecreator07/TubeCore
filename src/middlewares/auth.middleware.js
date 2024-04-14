import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    //find accessToken from header or cookies
    // console.log(req.cookies)
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    // console.log(token);
    // to make sure user is Valid, we verify token with our ACCESS_TOKEN_SECRET it will give payload from jwt.sign(from generateAccesToken() methods )
    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    // console.log(decodedToken);
    // here we are accessing and Updating user from DataBase
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    // console.log(user);
    if (!user) {
      throw new ApiError(401, "invalid user accessToken");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid data accessToken");
  }
});
