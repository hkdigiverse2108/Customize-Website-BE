import { Router } from "express";
import { ACCOUNT_TYPE } from "../../common";
import { mailSettingController } from "../../controllers";
import { allowRoles, requireAuth } from "../../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), mailSettingController.getMailSetting);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), mailSettingController.upsertMailSetting);

export { router as mailSettingRouter };
