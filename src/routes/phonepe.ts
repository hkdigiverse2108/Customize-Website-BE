import { Router } from "express";
import { paymentController } from "../controllers";
import { requireAuth } from "../middleware";

const router = Router();

router.post("/phonepe/create", requireAuth, paymentController.createPhonePeSubscriptionPayment);
router.post("/phonepe/callback", paymentController.phonePeCallback);

export { router as phonePeRouter };
