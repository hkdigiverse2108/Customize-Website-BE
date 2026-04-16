import { Router } from "express";
import multer from "multer";
import { fileFilter, fileStorage } from "../middleware";
import { uploadController } from "../controllers";

const router = Router();

const upload = multer({ storage: fileStorage, fileFilter }).fields([
  { name: "images", maxCount: 20 },
  { name: "pdf", maxCount: 20 },
]);

router.post("/", upload, uploadController.uploadFile);
router.delete("/delete", uploadController.deleteUploadedFile);
router.get("/images", uploadController.getAllImages);
router.get("/pdfs", uploadController.getAllPdfs);

export { router as uploadRouter };
