import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createTweet } from "../controllers/tweet.controller.js";

const router =Router()

router.use(verifyJwt)

router.route("/").post(createTweet)


export default router