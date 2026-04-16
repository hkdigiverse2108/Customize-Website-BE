import { Router } from "express";
import { uploadRouter } from "./upload";
import { planRouter } from "./plan";
import { authRouter } from "./auth";
import { userRouter } from "./user";
import { storeRouter } from "./store";
import { settingRouter } from "./setting";
import { phonePeRouter } from "./phonepe";
import{razorpayRouter} from "./razorpay";
const router = Router();

router.use("/upload", uploadRouter);
router.use("/plan", planRouter);
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/store", storeRouter);
router.use("/setting", settingRouter);
router.use("/phonepe", phonePeRouter);
router.use("/razorpay", razorpayRouter);


export { router };
