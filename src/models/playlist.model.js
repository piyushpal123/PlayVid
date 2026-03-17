import mongoose ,{Schema, SchemaType} from "mongoose"


const playlistSchema = new Schema({
    name:{
        type:String,
        required:true,

    },

    description:{
        type:String,
        required:true
    },

    vedios:[
        {
        type:Schema.Types.ObjectId,
        ref:"Vedio"
        }
    ],

    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true});


export const Playlist = new mongoose.model("Playlist",playlistSchema)