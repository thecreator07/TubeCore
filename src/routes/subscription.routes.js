import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";



const router=Router()

router.use(verifyJwt)


router
    .route("/channel/:channelId")
    .get(getSubscribedChannels)
    .post(toggleSubscription);

router.route("/user/:subscriberId").get(getUserChannelSubscribers);


export default router;