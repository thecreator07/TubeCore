import mongoose from "mongoose";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  //   console.log(req.user._id)
  const subscribed = await Subscription.findOne({
    //will return first document from subscription
    channel: channelId,
    subscriber: req.user?._id,
  });

  if (subscribed) {
    const unSubscribed = await Subscription.deleteOne({ _id: subscribed._id });
    if (!unSubscribed) {
      throw new ApiError(400, "Something went wrong during unSubscription");
    }
    return res
      .status(201)
      .json(
        new ApiResponse(
          200,
          { unSubscribed },
          "Channel Unsubscribe Successfully by User"
        )
      );
  }
  const newsubscriber = await Subscription.create({
    channel: channelId,
    subscriber: req.user?._id,
  });

  if (!newsubscriber) {
    throw new ApiError(400, "Something went wrong During Subscription");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        newsubscriber,
        "Channel Subscribed Successfully by user"
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "subscriber",
              as: "subscribedToSubscriber",
            },
          },
          {
            $addFields: {
              subscribedToSubscriber: {
                $cond: {
                  if: {
                    $in: [
                      new mongoose.Types.ObjectId(subscriberId),
                      "$subscribedToSubscriber.subscriber",
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
              subscriberCount: {
                $size: "$subscribedToSubscriber",
              },
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
              subscribedToSubscriber: 1,
              subscriberCount: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 1,
        subscriber: 1,
      },
    },
  ]);

  return res.json(
    new ApiResponse(200, { subscribers }, "Subscribers fetched successfully")
  );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "invalid channelId");
  }

  const channel = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(channelId), // Filter subscriptions where user is the subscriber
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel", //user suscribed to another channels (user follow another channel)
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "subscriber",
              as: "subscribedToChannel", //user follower follows another channels
            },
          },
          {
            $addFields: {
              subscribedToChannel: {
                $cond: {
                  if: {
                    $in: [
                      new mongoose.Types.ObjectId(channelId),
                      "$subscribedToChannel.channel",
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
              subscribedChannelcount: {
                $size: "$subscribedToChannel",
              },
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
              subscribedToChannel: 1,
              subscribedChannelcount: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$channel",
    },
    {
      $project: {
        _id: 1,
        subscribedChannel: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { channel }, "Channels fetched successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
