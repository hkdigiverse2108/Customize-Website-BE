import { Router } from "express";
import { ACCOUNT_TYPE } from "../common";
import { settingController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.STORE_OWNER), settingController.getSetting);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.STORE_OWNER), settingController.upsertSetting);

export { router as settingRouter };
