import { Router } from "express";
import { ACCOUNT_TYPE } from "../common";
import { productController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";

const router = Router();

router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), productController.createProduct);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), productController.updateProduct);
router.delete("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), productController.deleteProduct);
router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), productController.getProducts);
router.get("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), productController.getProductById);

export { router as productRouter };
