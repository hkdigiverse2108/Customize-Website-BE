import { Router } from "express";
import { ACCOUNT_TYPE } from "../common";
import { planController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";

const router = Router();

router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), planController.createPlan);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), planController.updatePlan);
router.delete("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), planController.deletePlan);
router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.STORE_OWNER), planController.getPlans);
router.get("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.STORE_OWNER), planController.getPlanById);

export { router as planRouter };
