import { Router } from "express";
import { ACCOUNT_TYPE } from "../common";
import { componentController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";

const router = Router();

router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN,), componentController.createComponent);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), componentController.updateComponent);
router.put("/customize", requireAuth, allowRoles(ACCOUNT_TYPE.VENDOR), componentController.customizeComponent);
router.post("/rollback", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), componentController.rollbackComponent);
router.delete("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), componentController.deleteComponent);
router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), componentController.getComponents);
router.get("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), componentController.getComponentById);

export { router as componentRouter };
