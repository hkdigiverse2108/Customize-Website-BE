import { Router } from "express";
import { ACCOUNT_TYPE } from "../../common";
import { storeSettingController } from "../../controllers";
import { allowRoles, requireAuth } from "../../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), storeSettingController.getStoreSetting);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), storeSettingController.upsertStoreSetting);

export { router as storeSettingRouter };
