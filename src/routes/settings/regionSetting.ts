import { Router } from "express";
import { ACCOUNT_TYPE } from "../../common";
import { regionSettingController } from "../../controllers";
import { allowRoles, requireAuth } from "../../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), regionSettingController.getRegionSetting);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), regionSettingController.upsertRegionSetting);

export { router as regionSettingRouter };
