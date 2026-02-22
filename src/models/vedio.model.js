import mongoose ,{Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const vedioSchema = new Schema( 
    {
        VedioFile:{
            type:String,// cloudinary url
            required:true,
        },
        thumbnail:{
            type:String, // cloudinary url
            required:true,
        },
        title:{
            type:String,
            reqired:true,
        },
        description:{
            type:String,
            required:true,
        },
        duration:{
            type:Number,
        },
        views:{
            type:Number,
            default:0,
        },
        IsPublished:{
            type:Boolean,
            default:true,
        },
        Owner:{
            type:Schema.Types.ObjectId,
            ref:"User",


        }

    }
,{timestamps:true})

vedioSchema.plugin(mongooseAggregatePaginate);

export  const Vedio = mongoose.model("Vedio",vedioSchema);
