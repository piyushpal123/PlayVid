import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Vedio} from "../models/vedio.model.js"
import {Like} from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {vedioId} = req.params
    const {page = 1, limit = 10} = req.query

    const vedio = await Vedio.findById(vedioId);
     if (!vedio) {
        throw new ApiError(404, "Video not found");
    }

    const commentAggregate = Comment.aggregate([
        {
            $match:{
                vedio:mongoose.Types.ObjectId(vedioId)
            },
            
        },
        {
             $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
             $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
             $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
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
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                },
                isLiked: 1
            }
        }

    ])
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const comments = await Comment.aggregatePaginate(
        commentAggregate,
        options
    );

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));


})

const addComment = asyncHandler(async (req, res) => {

    const {vedioId} = req.params;
    const {content} = req.body;

      if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const vedio = Vedio.findById(vedioId)
    if(!vedio){
        throw new ApiError(400,"vedio is not found")
    }
    const comment = await Comment.create({
         content,
        video: videoId,
        owner: req.user?._id
    })
    if (!comment) {
        throw new ApiError(500, "Failed to add comment please try again");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"));
    // TODO: add a comment to a video
})

const updateComment = asyncHandler(async (req, res) => {
    
    const {commentId} = req.params;
    const {content} = req.body;

    if(!content){
        throw new ApiError(400,"Content is required")

    }
    const comment= await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400,"comment not found")

    }
    if(comment?.owner.ToString()!== req.user?._id.ToString()){
        throw new ApiError(400,"only comment owner edit this comment")

    }

           const updatedComment =  await Comment.findByIdAndUpdate(comment?._id,{
                $set:{
                    content
                }

            },{new:true})

            if(!updatedComment){
                throw new ApiError(500, "Failed to edit comment please try again")
            }

            return res
            .status(200)
            .json(new ApiResponse(200,updatedComment,"comment edited Successfully"))

    
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400,"commentid is not existed");
    }
    if(comment.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(400,"only comment owner delete this comment")
    }
      await Comment.findByIdAndDelete(commentId);

     await Like.deleteMany({
        comment: commentId,
        likedBy: req.user
    });

     return res
        .status(200)
        .json(
            new ApiResponse(200, { commentId }, "Comment deleted successfully")
        );


})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }