import { Router } from "express";
import { authController } from "../controllers";
import { requireAuth } from "../middleware";

const router = Router();

router.post("/signup", authController.signup);
router.post("/google-auth", authController.googleAuth);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/resend-otp", authController.resendOtp);
router.post("/reset-password", authController.resetPassword);
router.post("/change-password", requireAuth, authController.changePassword);
router.post("/logout", requireAuth, authController.logout);

export { router as authRouter };
