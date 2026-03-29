import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Vedio } from "../models/vedio.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!(name && description)){
        throw new ApiError(400,"name and description is required");
    }
     const playlistCreated = await Playlist.create({
        name:name,
        description:description,
        owner :req.user?._id
      })
      if(!playlistCreated){
        throw new ApiError(400,"Playlist not created Scuucessfully");
      }
      return res
      .status(200)
      .json(new ApiResponse(200,playlistCreated,"PlaylistCreated successfully"));

    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid userId")

    }

    const userPlaylist = await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)

            }
        },
        {
            $lookup:
            {
            from :"vedios",
            localField:"vedios",
            foreignField:"_id",
            as:"vedios"
            }

        },
        {
            $addFields:{
                 totalVideos: {
                    $size: "$vedios"
                },
                totalViews: {
                    $sum: "$vedios.views"
                }
            }
        },
        {
            $project:{
               _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1

            }
        }
    ])

   

    return res
    .status(200)
    .json(new ApiResponse(200,userPlaylist,"userPlaylist fetched Successfully"));




    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"playlistId is invalid ")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "Playlist Not Found")

    }
     const PlaylistVedios =    await Playlist.aggregate([
            {   
                $match:{
                    _id: new mongoose.Types.ObjectId(playlistId)
                }

            },
            {
                $lookup:{
                    from :"vedios",
                    localFeild:"vedios",
                    foriegnField:"_id",
                    as:"vedios"
                }
            },
            {
            $match: {
                "videos.isPublished": true
            }
        },
        {
            $lookup:{
                from:"users",
                localFeild:"owner",
                foriegnField:"_id",
                as:"owner"
            }
        },
        {
            $addFeilds:{
                totalVedios:{
                    $sum:"$vedios"
                },
                totalVeiws:{
                    $sum:"$vedios.veiws"
                },
                owner:{
                    $first:"$owner"
                }
                

            }
        },

        {
            $project:{
                name:1,
                description:1,
                createdAt:1,
                updatedAt:1,
                totalVedios:1,
                totalVeiws:1,
                owner:1,
                vedios:{
                    _id: 1,
                    "vedioFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                 owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }


                
            }
        }

           
        ])

        res
        .status(200)
        .json(200,PlaylistVedios[0], "PlaylistVedios fetched successfullly")

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, vedioId} = req.params
    // console.log(req.params)
    if(!(isValidObjectId(playlistId) && isValidObjectId(vedioId))){
        throw new ApiError(400," playlistId and vedioId is Invalid")
    }

   const playlist = await Playlist.findById(playlistId)
   const vedio    =  await Vedio.findById(vedioId)
   
   if(!playlist){
    throw new ApiError(400,"playlist not found")
   }
   if(!vedio){
    throw new ApiError(400,"vedio not found")
   }
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Only owner can add video to playlist");
}
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet: {
              vedios: vedioId,
            },
        },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(
            400,
            "failed to add video to playlist please try again"
        );
    }

    res
    .status(200)
    .json(new ApiResponse(400, updatedPlaylist,
                "Added video to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, vedioId} = req.params

    if(!(isValidObjectId(playlistId)&&isValidObjectId(vedioId))){
        throw new ApiError(400,"playList or vedioId is invalid")
    }

     const playlist = await Playlist.findById(playlistId)
   const vedio    =  await Vedio.findById(vedioId)
   
   if(!playlist){
    throw new ApiError(400,"playlist not found")
   }
   console.log("check",vedio);
   if(!vedio){
    throw new ApiError(400,"vedio not found")
   }
   if (!req.user || !playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "Only owner can modify playlist");
}
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist,
        {
            $pull: {
              vedios: vedioId,
            },
        },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(
            400,
            "failed to remove video to playlist please try again"
        );
    }

    res
    .status(200)
    .json(new ApiResponse(400, updatedPlaylist,
                " remove video to playlist successfully"))


    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
     if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid PlaylistId");
     }
     const playlist  = await Playlist.findById(playlistId);
     if(!playlist){
        throw new ApiError(400,"playlist is not exist");
     }

     if(playlist.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(400,"only owner can delete this playlist")
     }

      await Playlist.findByIdAndDelete(playlist?._id);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "playlist deleted successfully"
            )
        );



    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!name || !description) {
        throw new ApiError(400, "name and description both are required");
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can edit the playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $set: {
                name,
                description,
            },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "playlist updated successfully"
            )
        );
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}