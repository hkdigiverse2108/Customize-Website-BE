import { Router } from "express";
import { ACCOUNT_TYPE } from "../common";
import { discountController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";

const router = Router();

router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), discountController.createDiscount);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), discountController.updateDiscount);
router.delete("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), discountController.deleteDiscount);
router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), discountController.getDiscounts);
router.get("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), discountController.getDiscountById);

export { router as discountRouter };
