import path from "path";
import { HTTP_STATUS } from "../../common";
import { reqInfo, responseMessage, validate } from "../../helper";
import { deleteImageSchema } from "../../validation";
import url from "url";
import fs from "fs";
import { apiResponse } from "../../type";

let backendUrl = process.env.BACKEND_URL;

export const uploadFile = async (req, res) => {
  reqInfo(req);
  try {
    const hasImage = req?.files && req?.files?.images && req?.files?.images?.length > 0;
    const hasPdf = req?.files && req?.files?.pdf && req?.files?.pdf?.length > 0;

    if (!hasImage && !hasPdf) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage?.noFileUploaded, {}, {}));

    const uploadedImages = [];
    const uploadedPdfs = [];

    if (hasImage) {
      req.files.images.forEach((file) => {
        uploadedImages.push(`${backendUrl ? `${backendUrl}/` : ""}${file.path.replace(/\\/g, "/")}`);
      });
    }

    if (hasPdf) {
      req.files.pdf.forEach((file) => {
        uploadedPdfs.push(`${backendUrl ? `${backendUrl}/` : ""}${file.path.replace(/\\/g, "/")}`);
      });
    }

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage?.fileUploadSuccess, { images: uploadedImages, pdfs: uploadedPdfs }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteUploadedFile = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(deleteImageSchema, req.body, res);
    if (!value) return;

    const parsedUrl = url.parse(value.fileUrl);
    const pathParts = (parsedUrl.pathname || "").split("/").filter(Boolean);
    const type = pathParts.find((p) => ["images", "pdfs"].includes(p));

    if (!type) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Unsupported file type", {}, {}));

    const filePath = path.join(process.cwd(), parsedUrl.pathname.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "File not found", {}, {}));

    fs.unlinkSync(filePath);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "File deleted", {}, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getAllImages = async (req, res) => {
  reqInfo(req);
  try {
    const dir = "public/images";
    if (!fs.existsSync(dir)) return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Images", [], {}));
    const images = fs.readdirSync(dir).map((file) => `${process.env.BACKEND_URL}/public/images/${file}`);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Images", images, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getAllPdfs = async (req, res) => {
  reqInfo(req);
  try {
    const dir = "public/pdfs";
    if (!fs.existsSync(dir)) return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "PDFs", [], {}));
    const pdfs = fs.readdirSync(dir).map((file) => `${process.env.BACKEND_URL}/public/pdfs/${file}`);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "PDFs", pdfs, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
