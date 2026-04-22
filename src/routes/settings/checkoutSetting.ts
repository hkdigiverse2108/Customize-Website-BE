import { Router } from "express";
import { ACCOUNT_TYPE } from "../../common";
import { checkoutSettingController } from "../../controllers";
import { allowRoles, requireAuth } from "../../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), checkoutSettingController.getCheckoutSetting);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), checkoutSettingController.upsertCheckoutSetting);

export { router as checkoutSettingRouter };
