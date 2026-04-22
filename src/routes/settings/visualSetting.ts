import { Router } from "express";
import { ACCOUNT_TYPE } from "../../common";
import { visualSettingController } from "../../controllers";
import { allowRoles, requireAuth } from "../../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), visualSettingController.getVisualSetting);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), visualSettingController.upsertVisualSetting);

export { router as visualSettingRouter };
