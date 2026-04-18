import { Router } from "express";
import { ACCOUNT_TYPE } from "../common";
import { categoryController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";

const router = Router();

router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), categoryController.createCategory);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), categoryController.updateCategory);
router.delete("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), categoryController.deleteCategory);
router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), categoryController.getCategories);
router.get("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), categoryController.getCategoryById);

export { router as categoryRouter };
