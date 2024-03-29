import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

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

export default router;
