import { Router } from "express";
import { ACCOUNT_TYPE } from "../../common";
import { paymentSettingController } from "../../controllers";
import { allowRoles, requireAuth } from "../../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), paymentSettingController.getPaymentSetting);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), paymentSettingController.upsertPaymentSetting);

export { router as paymentSettingRouter };
