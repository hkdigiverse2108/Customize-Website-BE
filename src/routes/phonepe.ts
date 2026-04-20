import { Router } from "express";
import { phonePeController } from "../controllers";
import { requireAuth } from "../middleware";

const router = Router();

router.post("/phonepe/create", requireAuth, phonePeController.createPhonePeSubscriptionPayment);
router.post("/phonepe/callback", phonePeController.phonePeCallback);

export { router as phonePeRouter };
