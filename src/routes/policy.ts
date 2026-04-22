import { Router } from "express";
import { ACCOUNT_TYPE } from "../common";
import { policyController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";

const router = Router();

router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), policyController.addOrEditPolicy);
router.get("/", policyController.getPolicies);

export { router as policyRouter };
