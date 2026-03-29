import mongoose, {isValidObjectId} from "mongoose"
import {Vedio} from "../models/vedio.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteOnCloudinary} from "../utils/Cloudinary.js"



const getAllvedios = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all vedios based on query, sort, pagination

    console.log(userId)
    const pipeline = []
    if(query){
        pipeline.push(
            {
                $search:{
                    index:"search-vedios",
                    text:{
                     query: query,
                     path:["title","description"]
                         }

                }
            }
        )
    }
    // filter by userId

    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400,"Invalid User")
        }

        pipeline.push(

            {
                $match:{
                    owner: new mongoose.Types.ObjectId(userId)
                }
            }

        )
    }
    // vedio is pushed if and only if ispublished
     pipeline.push({
        $match:{isPublished:true}
     })

     // sortBy views, duration , createdAt
     // sorttype asc or desc

     if(sortBy && sortType){

     pipeline.push(

           { $sort:{
                [sortBy]:sortType=="asc"?1:-1
            }}
     )}

     else{
        pipeline.push(
            {
                $sort:{
                    createdAt:-1
                }
            }
        )
     }


     pipeline.push(
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            "avatar.url":1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$ownerDetails"

        }
     )

     const vedioAggregate = Vedio.aggregate(pipeline)

     const option ={
       page: parseInt(page,10),
       limit: parseInt(limit,10)

     };

     const vedio = await Vedio.aggregatePaginate(vedioAggregate,option);

     return res
     .status(200)
      .json(new ApiResponse(200, vedio, "vedios fetched successfully"));





})

const publishAvedio = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get vedio, upload to cloudinary, create vedio
    if(["title","description"].some((feild)=>!feild || feild.trim()=="")){
        throw  new ApiError(400,"All feild is required")
    }
    const vedioFileLocalPath = req.files?.vedioFile?.[0]?.path
    const ThumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if(!vedioFileLocalPath){
        throw new ApiError(400,"VedioFileLocalPath is required")
    }
    if(!ThumbnailLocalPath){
        throw new ApiError(400,"thumbnail path is required")
    }
  const vedioFile  =  await uploadOnCloudinary(vedioFileLocalPath);
   const thumbnail =   await uploadOnCloudinary(ThumbnailLocalPath);

   if(!vedioFile){
    throw new ApiError(400,"VedioFile not upload on cloudinary")
   }
   if(!thumbnail){
    throw new ApiError(400,"thumbnail is not upload on cloudinary")
   }

   // save on database
   const vedio =  await  Vedio.create(
        {
            
        VedioFile: {
            url: vedioFile.url,
            public_id: vedioFile.public_id
             },

        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id
        },
        title,
            description,
            duration:vedioFile.duration,

        Owner:req.user?._id,

        IsPublished:false,

        }
     )

     const vedioUploaded =  await Vedio.findById(vedio?._id)

     if(!vedioUploaded){
        throw new ApiError(400,"vedioUploaded failed please try again !!")
     }
     return res
        .status(200)
        .json(new ApiResponse(200, vedioUploaded, "vedio uploaded successfully"));
})

const getvedioById = asyncHandler(async (req, res) => {
    const { vedioId } = req.params
    //TODO: get vedio by id
    if(!isValidObjectId(vedioId)){
        throw new ApiError(400,"vedioId is invalid")
    }
  if(!isValidObjectId(req.user?._id)){
    throw new ApiError(400,"Invalid userId")
  }
  const vedio = await Vedio.aggregate([
    {
        $match:{
            _id :  new mongoose.Types.ObjectId(vedioId)
        }
    },
    {
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"vedio",
            as:"likes"
        }
    },
    {
        $lookup:{
            from :"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
                {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"

                }
                 },
                 {
                    $addFields:{
                        subcriberCount:{
                            $size :"$subcribers"
                        },
                         isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                    }
                 },

                 {
                    $project:{
                         username: 1,
                            "avatar.url": 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                    }
                 }
        ]
        }
    },

    {
        $addFields:{
            likesCount:{
                $size :"$likes"
            },
            owner:{
                $first:"$owner"
            },
            isLiked:{
                $cond:{
                    if:{$in:[req.user?.id,"$likes.likeBy"]},
                    then:true,
                    else:false
                }
            }
        }
    },
    {
        $project:{
            "VedioFile.url":1,
            title:1,
            description:1,
            views:1,
            createdAt:1,
            duration:1,
            likesCount:1,
            subscribersCount:1,
            comment:1,
            owner:1,
            isLiked:1
            


        }
    }
    
  ])

  if(!vedio){
    throw new ApiError(500,"Failed to fetch a vedio")
  }
// increase views of vedio 
  await Vedio.findByIdAndUpdate(vedioId,
   { $inc:{
        views:1,
    }}
  )
  // add the user watch history 

  await User.findByIdAndUpdate(req.user?._id,{
    $addToSet:{
        watchHistory:vedioId
    }
  })

  return res
        .status(200)
        .json(
            new ApiResponse(200, vedio[0], "vedio details fetched successfully")
        );
   


})

const updatevedio = asyncHandler(async (req, res) => {
    const { vedioId } = req.params
    const {title,description} = req.body
    //TODO: update vedio details like title, description, thumbnail
    if(!isValidObjectId(vedioId)){
        throw  new ApiError(400,"VedioId is invalid ")
    }

    if(!(title && description )){
        throw new ApiError(400,"title and description is required")
    }
    
   
     const vedio = await Vedio.findById(vedioId)

     if(!vedio){
        throw new ApiError(400,"vedio not found")
     }
     
     
     if(vedio?.Owner.toString() !== req.user?._id.toString()){
         throw new ApiError(400,"you can edit vedio as you are not the owner")
        }
    console.log(vedio)
        
     const thumbnailToDelete = vedio?.thumbnail?.public_id;

    const thumbnailLocalPath = req.file?.path

    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail){
        throw new ApiError(400,"thumbnail not found")
    }

    const updateVedio = await Vedio.findByIdAndUpdate(
        vedioId,
        {
        $set:{
        title,
        description,
        thumbnail:{
             public_id: thumbnail.public_id,
                    url: thumbnail.url
        }
    }
    },
    {new:true}
    
)
 if (!updateVedio) {
        throw new ApiError(500, "Failed to update vedio please try again");
    }

    if (updateVedio) {
        await deleteOnCloudinary(thumbnailToDelete);
    }
     return res
        .status(200)
        .json(new ApiResponse(200, updateVedio, "vedio updated successfully"));

})

const deleteVedio = asyncHandler(async (req, res) => {
    const { vedioId } = req.params;
    //TODO: delete vedio 
    if(!isValidObjectId(vedioId)){
        throw new ApiError(400,"Invalid VedioId")
    }
    
    const vedio = await Vedio.findById(vedioId)
    if(!vedio){
        throw new ApiError(400,"vedio is not found")
    }
    
    console.log(vedio)
    // console.log("owner:",vedio.owner);
    // console.log("user:", req.user._id);
    //     if (!vedio.Owner.equals(req.user._id)) {
        //     throw new ApiError(403, "Not authorized");
        // }
        
        const vedioDeleted = await Vedio.findByIdAndDelete(vedio?._id);
    
        
        if (!vedioDeleted) {
            throw new ApiError(400, "Failed to delete the vedio please try again");
        }
        
        
        await deleteOnCloudinary(vedio.thumbnail.public_id); // vedio model has thumbnail public_id stored in it->check vedioModel
      
        // await deleteOnCloudinary(vedio.vedioFile.public_id, "vedio"); // specify vedio while deletingvedio
        
        // delete vedio likes
        await Like.deleteMany({
            vedio: vedioId
        })
        
        // delete vedio comments
        await Comment.deleteMany({
            vedio: vedioId,
        })
               
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "vedio deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { vedioId } = req.params

    if(!vedioId){
        throw new ApiError(400,"Invalid vedioId")
    }
    const vedio = await Vedio.findByIdAndUpdate(vedioId)
    if(!vedio){
        throw new ApiError(400,"vedio is invalid")
    }
if (!vedio.Owner.equals(req.user._id)) {
    throw new ApiError(403, "Not authorized");
}

      const toggleVedioPublish =   await Vedio.findByIdAndUpdate(vedioId,
        {
            $set:{
                isPublished:!vedio?.isPublished
            }
        },{new:true}
    )

    if(!toggleVedioPublish){
          throw new ApiError(500, "Failed to toogle video publish status");
    }
     return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: toggleVedioPublish.isPublished },
                "Video publish toggled successfully"
            )
        );
        
   
})

export {
    getAllvedios,
    publishAvedio,
    getvedioById,
    updatevedio,
    deleteVedio,
    togglePublishStatus
}