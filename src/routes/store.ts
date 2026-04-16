import { Router } from "express";
import { ACCOUNT_TYPE } from "../common";
import { storeController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";

const router = Router();

router.post("/", requireAuth, allowRoles( ACCOUNT_TYPE.STORE_OWNER), storeController.createStore);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.STORE_OWNER), storeController.updateStore);
router.delete("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), storeController.deleteStore);
router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), storeController.getStores);
router.get("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.STORE_OWNER), storeController.getStoreById);

export { router as storeRouter };
