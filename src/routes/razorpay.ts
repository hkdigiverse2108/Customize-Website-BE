import { Router } from "express";
import { paymentController } from "../controllers";
import { requireAuth } from "../middleware";

const router = Router();

router.post("/razorpay/create", requireAuth, paymentController.createRazorpaySubscriptionPayment);
router.post("/razorpay/verify", requireAuth, paymentController.verifyRazorpaySubscriptionPayment);

export { router as razorpayRouter };
