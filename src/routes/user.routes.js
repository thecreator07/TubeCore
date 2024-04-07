import { Router } from "express";
import {
  changeCurrentPassword,
  currentuser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAvatar,
  updatecoverImage,
  updateUserDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

//this route is for user registration(sign up), which will be handle by the 'registerUser' controller function
router.route("/register").post(
  //In upload middleware will we can use fields to access more than one File from the request Body(frontend)
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//Secured Route
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refreshToken").post(verifyJwt, refreshAccessToken);
router.route("/changePassword").post(verifyJwt, changeCurrentPassword);
router.route("/current_User").get(verifyJwt, currentuser);
router
  .route("/update_account")
  .patch(
    verifyJwt,
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    updateUserDetails
  );
router.route("/avatar").patch(verifyJwt, upload.single("avatar"), updateAvatar);
router
  .route("/cover_image")
  .patch(verifyJwt, upload.single("coverImage"), updatecoverImage);
export default router;
