import express from "express";
import { getStorefrontPage } from "../controllers/storefront";

const router = express.Router();

router.get("/page", getStorefrontPage);

export default router;
