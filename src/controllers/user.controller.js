    import {asyncHandler} from '../utils/asyncHandler.js'
    import {ApiError} from '../utils/ApiError.js'
    import {User} from '../models/user.model.js'
    import { uploadOnCloudinary } from '../utils/Cloudinary.js'
    import { ApiResponse } from '../utils/ApiResponse.js'


    const generateAccessTokenAndRefreshToken = async(userId)=>{
         try {
            const user = await  User.findById(userId)
            // console.log("check:", user)
            const accessToken =  user. generateAccessToken()
            // console.log("atkone:",accessToken)
            const refreshToken = user.generateRefreshToken()

            user.refreshToken = refreshToken
            await user.save({validateBeforeSave:false})
            return {accessToken,refreshToken}
            
         } catch (error) {
            throw new ApiError(500 , "Something went wrong while generating refresh or Access token")
         }
        
    }

    const registerUser = asyncHandler(async(req,res)=>{
        // get user details from frontend 
        // validation  not empty 
        // check if user already exist :: username , email
        // check fro images , check for avaatar 
        // upload them to cloudinary avatr
        // create user object create in db 
        // remove password and refresh token field from response
        // check for user creation 
        // return res
         const {fullname , email , username, password } = req.body

         console.log("email:", email);

         if(
            [fullname,email,username,password].some((feild)=>
            feild?.trim()=="")
         ){
            throw  new ApiError(400, "All feilds is required")

         }

         const existedUser =  await User.findOne({
            $or:[ {email},{username}]
          })

         if(existedUser){
            throw new ApiError(409,"user is already existed");
         }

                const avatarLocalPath = req.files?.avatar?.[0]?.path;
               // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

                let coverImageLocalPath;

                if(req.file && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
                  coverImageLocalPath = req.files.coverImage[0].path;
                }
                

                if(!avatarLocalPath){
                    throw new ApiError(400 , "Avatar file is required ")
                }

              const avatar =    await uploadOnCloudinary(avatarLocalPath);
              const coverImage = await uploadOnCloudinary(coverImageLocalPath);
              

              if(!avatar){
               throw new ApiError(400,"avatar file is required ")
              }

            const user = await  User.create({
               fullname,
               avatar : avatar.url,
               coverImage:coverImage?.url||"",
               email,
               password,
               username:username.toLowerCase(),
              })

            const createdUser =   await User.findById(user._id).select(
               "-password -refreshToken"
              )

              if(!createdUser){
               throw new ApiError(500,"Something went wrong while registering user");
              }
              
              
         return res.status(201).json(
            new ApiResponse(200,createdUser,"User register Successfully")
         )
         
         
         

    })

    const loginUser = asyncHandler(async(req,res)=>{
      // req->body = data 
      // username ||  email
      // password 
      // validation 
      // access token and refresh Token 
      // send cookie
      
      const {email,username,password} = req.body;

      if(!(username || email)){
         throw new ApiError(400, "username or email is required");
      }

       const user =  await User.findOne({
         $or : [{email},{username}]
      })

       const isPasswordValid = await user.isPasswordCorrect(password);

         if(!isPasswordValid){
            throw new ApiError(401,"Invlaid User Credentials")
         }

       const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id);

       const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

       const options = {
         httpOnly :true,   // only server access not from frontend 
         secure :true,
       }

       return res
       .status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",refreshToken,options)
       .json(
         new ApiResponse(
            200,
            {
               user : {loggedInUser,accessToken,refreshToken}
            },
            "User logged in Successfully"
         )
       )



    })

    const logoutUser = asyncHandler(async(req,res)=> 
      {

         User.findByIdAndUpdate(

           req.user. _id,
           {
           $unset: {
                refreshToken: 1 // this will remove from database
                
            }
         },

         {
            new :true
         }

         )

       const options = {
            httpOnly:true,
            secure :true
         }

        return res
         .status(200)
         .clearCookie("accessToken",options)
         .clearCookie("refreshToken",options)
         .json(new ApiResponse(200,{},"User logout Successfully"))
            

         
    })

    const refreshAccessToken = asyncHandler(async(req,res)=>{
      const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

      if(!incomingRefreshToken){
         throw new ApiError(401,"unauthorised request")
      }

      try {
         
        const decodedToken =  jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
       const user =  await User.findById(decodedToken?._id)

       if(!user){
         throw new ApiError(401, "Invalid Refresh Token")
       }
       if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401 , "Refresh Token is Expired or Used ")
       }

       const options = {
         httpOnly:true,
         secure :true
       }
    const {accessToken , newRefreshToken} =   await generateAccessTokenAndRefreshToken(user._id);

      return res
      .status()
      .cookie("accessToken",accessToken,options)
      .cokokie("refreshToken",newRefreshToken)
      .json(
         
            new ApiResponse(
               200,
               {accessToken,refreshToken:newRefreshToken},
               "Access token refreshed successfully"
            )

         
      )



      } catch (error) {
         throw new ApiError(401,error?.message || "Invalid Refresh Token")
         
      }

    })


    const ChangeCurrentPassword = asyncHandler(async(req,res)=>{

      const {oldPassword , newPassword} = req.body

      const user = await User.findById(req.user?._id)

     const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)

     if(!isPasswordCorrect){
      throw new ApiError(400 , "Invalid old password")
     }

     user.password = newPassword

     await user.save({validateBeforeSave:false})

     return res
     .status(200)

     .json(new ApiResponse(200,{},"password succesfully changed"))




    })

    const getCurrentUser = asyncHandler(async(req,res)=>{
      return res
      .status(200)
      .json(200,req.user,"current user fetched successfully")
    })

    const UpdateAccountDetail = asyncHandler(async(req,res)=>{
      const  {fullName, email } = req.body

      if(!(fullName|| email)){
         throw new ApiError(400, "all feild is required")
      }
         const user =  User.findByIdAndUpdate(
            req.user?._id,
            {
               $set:{
                  fullName :fullName,
                  email : email
               }

            },
            {new:true}
         ).select("-password")

         return res
         .status(200)
         .json(new ApiResponse(200,user,"Account detail updated successfully "))
         

    })


    const UpdateUserAvatar = asyncHandler(async(req,res)=>{
             const avatarLocalPath =  req.file?.path
             if(!avatarLocalPath){
               throw new ApiError(400,"Avatar File is missing ")
             }
             const avatar = await uploadOnCloudinary(avatarLocalPath)

             if(!avatar.url){
               throw new ApiError(400,"error while uploading on avatar ")
             }

          const user =   await User.findOneAndUpdate(
               req.User?._id,
               {
                  $set:{
                     avatar :avatar.url
                  }
               },{new:true}
             ).select("-password")

             return  res
             .status(200)
             .json(new ApiResponse(200,ser,"AvatarUpdate successfully"))
            


    })


     const UpdateUserCoverImage = asyncHandler(async(req,res)=>{
             const coverImageLocalPath =  req.file?.path
             if(!coverImageLocalPath){
               throw new ApiError(400,"coverImage File is missing ")
             }
             const coverImage = await uploadOnCloudinary(coverImageLocalPath)

             if(!coverImage.url){
               throw new ApiError(400,"error while uploading on CoverImage ")
             }

          const user =   await User.findOneAndUpdate(
               req.User?._id,
               {
                  $set:{
                     coverImage :coverImage.url
                  }
               },{new:true}
             ).select("-password")

           return  res
             .status(200)
             .json(new ApiResponse(200,user,"coverImageUpdate successfully"))
            


    })

     const GetUserChannelProfile = asyncHandler(async(req,res)=>{

          const {username}  = req.params

          if(!username){
            throw new ApiError(400,"username is missing ")
          }
          User.find({username})

          const Channel = await User.aggregate([

            {
               $match:{
                  username:username?.toLowerCase()
               }
            },

            {
               $lookup:{
                  from:"subscriptions",
                  localField:"_id",
                  foreignField:"channel",
                  as:"subscribers"
               }
            },

            {
               $lookup:{
                  from :"subscription",
                  localField:"_id",
                  foreignField:"subscriber",
                  as:"subscribedTo"
               }
            },

            {
               $addFields:{
                  subcriberCount:{
                     $size:"$subscribers"
                  },
                  channelSubscribedToCount :{
                     $size :"$subscribedTo"
                  },
                  isSubscribed:{
                     $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                     }
                  }
               }
            },

            {
               $project:{
                  fullName:1,
                  username:1,
                  subcriberCount:1,
                  channelSubscribedToCount:1,
                  isSubscribed:1,
                  avatar:1,
                  coverImage:1,



               }
            }

          ])

          // console.log(Channel)
          if(!Channel?.length){
            throw new ApiError(404,"channel does not exist")
          }

          return res
          .status(200)
          .json(new ApiResponse(200,Channel[0]),"Channel fetched successfully")
     })

    const getWatchHistory = asyncHandler(async(req,res)=>{
      const user =  await User.aggregate([
         {
            $match:{
               _id :new mongoose.Types.ObjectId(req.user?._id)
            }
         },
         
        { $lookup:{
            from :"vedios",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
               {
               $lookup:{
                  from :"users",
                  localField:"owner",
                  foreignField:"_id",
                  as :"owner",
                  pipeline:[
                     {
                        $project:{
                           fullname:1,
                           username:1,
                           avatar:1,

                        }
                     }
                  ]
               }
            },
            {
               $addFields:{
                  owner:{
                     $first:"$owner"
                  }
               }
            }
            ]
         },
      }
       
      ])

         if(!user){
            throw new ApiError(400, "user does not exist")
         }

         res
         .status(200)
         .json(new ApiResponse(200,user[0].getWatchHistory,"watched history successfully"))
    })

    export  {registerUser,loginUser,logoutUser,refreshAccessToken,ChangeCurrentPassword,getCurrentUser,UpdateAccountDetail,UpdateUserAvatar,UpdateUserCoverImage,GetUserChannelProfile,getWatchHistory};