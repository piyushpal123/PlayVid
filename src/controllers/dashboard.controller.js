import mongoose from "mongoose"
import {Vedio} from "../models/vedio.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total vedio views, total subscribers, total vedios, total likes etc.
    const userId = req.user?._id
    
    const totalSubscriber = await Subscription.aggregate(
        [
            {
                $match:{
                    channel:new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $group: {
                _id: null,
                subscribersCount: {
                    $sum: 1
                }
            }
            }

        ]
    )
     const vedio = await Vedio.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "vedio",
                as: "likes"
            }
        },
        {
            $project: {
                totalLikes: {
                    $size: "$likes"
                },
                totalViews: "$views",
                totalvedios: 1
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: {
                    $sum: "$totalLikes"
                },
                totalViews: {
                    $sum: "$totalViews"
                },
                totalvedios: {
                    $sum: 1
                }
            }
        }
    ]);

  const channelStats = {
        totalSubscribers: totalSubscriber[0]?.subscribersCount || 0,
        totalLikes: video[0]?.totalLikes || 0,
        totalViews: video[0]?.totalViews || 0,
        totalVideos: video[0]?.totalVideos || 0
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channelStats,
                "channel stats fetched successfully"
            )
        );
});

const getChannelvedios = asyncHandler(async (req, res) => {
    // TODO: Get all the vedios uploaded by the channel

     const userId = req.user?._id;

    const vedios = await Vedio.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "vedio",
                as: "likes"
            }
        },
        {
            $addFields: {
                createdAt: {
                    $dateToParts: { date: "$createdAt" }
                },
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 1,
                "videoFile.url": 1,
                "thumbnail.url": 1,
                title: 1,
                description: 1,
                createdAt: {
                    year: 1,
                    month: 1,
                    day: 1
                },
                isPublished: 1,
                likesCount: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            vedios,
            "channel stats fetched successfully"
        )
    );
});




export {
    getChannelStats, 
    getChannelvedios
    }