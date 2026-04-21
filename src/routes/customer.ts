import { Router } from "express";
import * as customerController from "../controllers/customer";
import { requireAuth, allowRoles } from "../middleware"; // Using correct middleware members
import { ACCOUNT_TYPE } from "../common";

const router = Router();

// Only VENDOR or ADMIN can manage customers
router.post("/add", requireAuth, allowRoles(ACCOUNT_TYPE.VENDOR, ACCOUNT_TYPE.ADMIN), customerController.addCustomerByVendor);
router.get("/list/:storeId", requireAuth, allowRoles(ACCOUNT_TYPE.VENDOR, ACCOUNT_TYPE.ADMIN), customerController.getStoreCustomers);

export const customerRouter = router;
