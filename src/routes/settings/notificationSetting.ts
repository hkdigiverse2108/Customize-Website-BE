import { Router } from "express";
import { ACCOUNT_TYPE } from "../../common";
import { notificationSettingController } from "../../controllers";
import { allowRoles, requireAuth } from "../../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), notificationSettingController.getNotificationSetting);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), notificationSettingController.upsertNotificationSetting);

export { router as notificationSettingRouter };
