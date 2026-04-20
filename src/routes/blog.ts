import { Router } from "express";
import { blogController } from "../controllers";
import { allowRoles, requireAuth } from "../middleware";
import { ACCOUNT_TYPE } from "../common";

const router = Router();

router.get("/", blogController.getBlogs);
router.get("/:id", blogController.getBlogById);

// Admin & Vendor Auth Required for Mutation
router.post("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), blogController.createBlog);
router.put("/", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), blogController.updateBlog);
router.delete("/:id", requireAuth, allowRoles(ACCOUNT_TYPE.ADMIN, ACCOUNT_TYPE.VENDOR), blogController.deleteBlog);

export { router as blogRouter };
