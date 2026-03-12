import mongoose ,{Schema} from "mongoose";
import { User } from "./user.model";

const subcriptionSchema = new Schema (
    {
        subscriber:{ // user which subscribing 
            type : mongoose.Schema.ObjectId, 
            ref :"User"
        },
        channel :{
            type : mongoose.Schema.ObjectId, 
            ref :"User"
        }

},{timestamps:true});

export const Subscription = mongoose.model("Subscription",subcriptionSchema);