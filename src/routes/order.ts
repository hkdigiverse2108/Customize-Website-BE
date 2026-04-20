import { Router } from "express";
import { ACCOUNT_TYPE } from "../common";
import { orderController } from "../controllers";
import { allowRoles, requireAuth, optionalAuth } from "../middleware";

const router = Router();

router.post("/", optionalAuth, orderController.createOrder);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.VENDOR), orderController.updateOrder);
router.delete("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.VENDOR), orderController.deleteOrder);
router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.VENDOR), orderController.getOrders);
router.get("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.VENDOR), orderController.getOrderById);

export { router as orderRouter };
