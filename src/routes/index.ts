import { Router } from "express";
import { uploadRouter } from "./upload";
import { planRouter } from "./plan";
import { authRouter } from "./auth";
import { userRouter } from "./user";
import { storeRouter } from "./store";
import { settingRouter } from "./setting";
import { phonePeRouter } from "./phonepe";
import { razorpayRouter } from "./razorpay";
import { themeRouter } from "./theme";
import { pageRouter } from "./page";
import { componentRouter } from "./component";
import { siteRouter } from "./site";
import { categoryRouter } from "./category";
import { collectionRouter } from "./collection";
import { productRouter } from "./product";
import { orderRouter } from "./order";
import { discountRouter } from "./discount";
import { blogRouter } from "./blog";
import storefrontRouter from "./storefront";
import { customerRouter } from "./customer";
import { policyRouter } from "./policy";
const router = Router();

router.use("/storefront", storefrontRouter);

router.use("/upload", uploadRouter);
router.use("/plan", planRouter);
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/store", storeRouter);
router.use("/setting", settingRouter);
router.use("/phonepe", phonePeRouter);
router.use("/razorpay", razorpayRouter);
router.use("/theme", themeRouter);
router.use("/page", pageRouter);
router.use("/component", componentRouter);
router.use("/category", categoryRouter);
router.use("/collection", collectionRouter);
router.use("/product", productRouter);
router.use("/order", orderRouter);
router.use("/discount", discountRouter);
router.use("/blog", blogRouter);
router.use("/customer", customerRouter);
router.use("/policy", policyRouter);
router.use("/site", siteRouter);


export { router };
