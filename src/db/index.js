import mongoose from 'mongoose'
import {DB_NAME} from '../constants.js'
import "dotenv/config";


const ConnectDb = async()=>{
    try {
      const ConnectionInstance =  await  mongoose.connect(`${process.env.MONGOODB_URI}/${DB_NAME}`);
      console.log("/n MongoDB Connected DB_HOST!! ${`ConnectionInstance.connection.host`}")
    } catch (error) {
        console.error("Mongodb show error",error);
        process.exit(1);
        
    }
}
export  default ConnectDb;