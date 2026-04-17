import { Router } from "express";
import { ACCOUNT_TYPE } from "../common";
import { themeController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";

const router = Router();

router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), themeController.createTheme);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), themeController.updateTheme);
router.put("/customize", requireAuth, allowRoles(ACCOUNT_TYPE.VENDOR), themeController.customizeTheme);
router.delete("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN), themeController.deleteTheme);
router.get("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), themeController.getThemes);
router.get("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), themeController.getThemeById);

export { router as themeRouter };
