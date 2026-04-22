import { Router } from "express";
import { ACCOUNT_TYPE } from "../../common";
import { themeSettingController } from "../../controllers";
import { allowRoles, requireAuth } from "../../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), themeSettingController.getThemeSetting);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), themeSettingController.upsertThemeSetting);
router.post("/publish", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), themeSettingController.publishTheme);

export { router as themeSettingRouter };
