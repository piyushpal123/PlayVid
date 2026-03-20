import mongoose ,{Schema} from "mongoose";
import { User } from "./user.model.js";

const subcriptionSchema = new Schema (
    {
        subscriber:{ // user which subscribing 
            type : mongoose.Schema.Types.ObjectId, 
            ref :"User"
        },
        channel :{
            type : mongoose.Schema.Types.ObjectId, 
            ref :"User"
        }

},{timestamps:true});

export const Subscription = mongoose.model("Subscription",subcriptionSchema);