import { Router } from "express";
import { ACCOUNT_TYPE } from "../../common";
import { taxSettingController } from "../../controllers";
import { allowRoles, requireAuth } from "../../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), taxSettingController.getTaxSetting);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), taxSettingController.upsertTaxSetting);

export { router as taxSettingRouter };
