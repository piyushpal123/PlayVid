import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"channelId is in valid")
    }

    const isSubscribed = await Subscription.findOne({
        subscriber:req.user?._id,
        channel: channelId?._id
    })

    if(isSubscribed){
        await Subscription.findByIdAndDelete(isSubscribed?._id)
          return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { subscribed: false },
                    "unsunscribed successfully"
                )
            );
    }

     await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
    });

     return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed: true },
                "subscribed successfully"
            )
        );




})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId){
        throw new ApiError(400,"Invlaid channelId")
    }
     channelId = new mongoose.Types.ObjectId(channelId);
     const subscribers = await Subscription.aggregate([
        {
            $match:{
                Channel :channelId
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
                pipeline:[
                    {
                       $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber",
                        }, 
                    },

                    {
                        $addField:{
                            subcribedToSubcriber:{
                                $cond:{
                                    $if:{
                                        $in:[
                                            "channelId", 
                                            "$subscribedToSubscriber.subscriber"]
                                    },
                                    then:true,
                                    else:false
                                }
                            },
                            
                           subscribercount: {
                                $size:"$subcribedToSubscriber"
                            }
                        }
                    }
                ]
            },
            
        },
        
            
               { $unwind:" $subscriber"},

         {
            $project:{
                _id: 0,
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    subscribedToSubscriber: 1,
                    subscribersCount: 1,
                },
            }
         }      
        

     ])

      return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                "subscribers fetched successfully"
            )
        );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const subcribedSchannel = await Subscription.aggregate([

        {
            $match:{
                subcriber:mongoose.Types.ObjectId(subscriberId)
            },
        },

        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                 as: "subscribedChannel",
                 pipeline:[
                    {
                        
                    }
                 ]
            }
        }

    ])


})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}