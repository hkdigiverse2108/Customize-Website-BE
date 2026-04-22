import { Router } from "express";
import { ACCOUNT_TYPE } from "../../common";
import { domainSettingController } from "../../controllers";
import { allowRoles, requireAuth, checkPlanLimit } from "../../middleware";

const router = Router();

router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), domainSettingController.getDomainSettings);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), checkPlanLimit("domains"), domainSettingController.addDomainSetting);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), domainSettingController.updateDomainSetting);
router.delete("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), domainSettingController.deleteDomainSetting);

export { router as domainSettingRouter };
