import { Router } from "express";
import { ACCOUNT_TYPE } from "../common";
import { userController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), userController.getAllUsers);
router.get("/:id", requireAuth, userController.getUserById);
router.put("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), userController.updateUser);

export { router as userRouter };
