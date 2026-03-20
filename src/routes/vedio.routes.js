import { Router } from 'express';
import {
   getAllvedios,
    publishAvedio,
    getvedioById,
    updatevedio,
    deleteVedio,
    togglePublishStatus,
} from "../controllers/vedio.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllvedios)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAvedio
    );

router
    .route("/:videoId")
    .get(getvedioById)
    .delete(deleteVedio)
    .patch(upload.single("thumbnail"), updatevedio);

router.route("/toggle/publish/:vedioId").patch(togglePublishStatus);

export default router