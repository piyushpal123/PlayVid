import mongoose ,{Schema, SchemaType} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const commentSchema = new Schema({
    content:{
        type:string,
        required:true
    },
    vedio:{
        type:Schema.Types.ObjectId,
        ref:"Vedio"
    },
    
     owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true});

commentSchema.plugin(mongooseAggregatePaginate)



export const Comment = mongoose.model("Commnet",commentSchema )