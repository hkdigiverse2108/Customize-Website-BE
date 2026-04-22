import { Router } from "express";
import { ACCOUNT_TYPE } from "../../common";
import { shippingSettingController } from "../../controllers";
import { allowRoles, requireAuth } from "../../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), shippingSettingController.getShippingSettings);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), shippingSettingController.addShippingSetting);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), shippingSettingController.updateShippingSetting);
router.delete("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), shippingSettingController.deleteShippingSetting);

export { router as shippingSettingRouter };
