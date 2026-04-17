import { Router } from "express";
import { siteController } from "../controllers";

const router = Router();

router.get("/:storeSlug", siteController.getPublishedSite);
router.get("/:storeSlug/page/:pageSlug", siteController.getPublishedSitePage);

export { router as siteRouter };
