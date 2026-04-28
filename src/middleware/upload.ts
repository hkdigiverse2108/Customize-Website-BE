import multer from "multer";
import path from "path";
import fs from "fs";

const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpg", "image/webp", "image/jpeg"]);
const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

export const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const isPdf = file.mimetype === "application/pdf";
      const isImage = file.mimetype.startsWith("image/");
      const isDocument = DOCUMENT_MIME_TYPES.has(file.mimetype);

      let baseDir = "public/files";
      if (isPdf) baseDir = "public/pdfs";
      else if (isImage) baseDir = "public/images";
      else if (isDocument) baseDir = "public/files";

      const dir = path.join(process.cwd(), baseDir);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, path.join(baseDir));
    } catch (error) {
      cb(error); // <-- THROW error to Multer properly
    }
  },
  filename: (_, file, cb) => {
    try {
      const sanitizedOriginalName = file.originalname.replace(/\s+/g, "-");
      cb(null, `${Date.now()}_${sanitizedOriginalName}`);
    } catch (error) {
      cb(error);
    }
  },
});

export const fileFilter = (_, file, cb) => {
  const allowed = new Set([...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES]);

  cb(null, allowed.has(file.mimetype));
};
