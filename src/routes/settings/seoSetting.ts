import { Router } from "express";
import { ACCOUNT_TYPE } from "../../common";
import { seoSettingController } from "../../controllers";
import { allowRoles, requireAuth } from "../../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), seoSettingController.getSEOSetting);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), seoSettingController.upsertSEOSetting);

export { router as seoSettingRouter };
