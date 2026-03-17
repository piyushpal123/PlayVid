import mongoose ,{Schema, SchemaType} from "mongoose"

const likeSchema = new Schema({
    vedio:{
        type : Schema.Types.ObjectId,
        ref:"Vedio"
    },

    comment:{
        type : Schema.Types.ObjectId,
        ref:"Comment"
    },

    tweet:{
        type : Schema.Types.ObjectId,
        ref:"Tweet"
    },

    likedBy:{
        type : Schema.Types.ObjectId,
        ref:"User"
    },


},{timestamps:true})

export const Like = new mongoose.model("Like",likeSchema)