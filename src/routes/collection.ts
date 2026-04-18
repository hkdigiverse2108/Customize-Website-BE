import { Router } from "express";
import { ACCOUNT_TYPE } from "../common";
import { collectionController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";

const router = Router();

router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), collectionController.createCollection);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), collectionController.updateCollection);
router.delete("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), collectionController.deleteCollection);
router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), collectionController.getCollections);
router.get("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), collectionController.getCollectionById);

export { router as collectionRouter };
