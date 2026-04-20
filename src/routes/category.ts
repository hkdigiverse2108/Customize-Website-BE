import { Router } from "express";
import { categoryController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";
import { ACCOUNT_TYPE } from "../common";

const router = Router();

router.get("/", categoryController.getCategories);
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), categoryController.createCategory);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), categoryController.updateCategory);
router.delete("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), categoryController.deleteCategory);

export { router as categoryRouter };
