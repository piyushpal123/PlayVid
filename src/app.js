import cookieParser from 'cookie-parser';
import express from 'express'
import cors from 'cors'
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    Credential:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:"true",limit:"16kb"}));
app.use(express.static("public"))
app.use(cookieParser())

// import routes 
import userRouter from './routes/user.routes.js';
import VedioRouter from './routes/vedio.routes.js'
import commentRouter from './routes/comment.routes.js'
import LikeRouter from './routes/like.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import subcriptionRouter from './routes/subcription.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import healthcheckRouter from './routes/healthcheck.routes.js'

app.use("/api/v1/users",userRouter);
app.use("/api/v1/vedio",VedioRouter);
app.use("/api/v1/comment",commentRouter);
app.use("/api/v1/Like",LikeRouter);
app.use("/api/v1/playlist",playlistRouter);
app.use("/api/v1/subcription",subcriptionRouter);
app.use("/api/v1/dashboardRouter",dashboardRouter);
app.use("/api/v1/healthcheck",healthcheckRouter);
app.use("/api/v1/tweet",tweetRouter);



// http://localhost:8000/api/v1/users/register

export {app};
