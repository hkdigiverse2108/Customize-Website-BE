import path from "path";
import {  HTTP_STATUS } from "../../common";
import { reqInfo, responseMessage } from "../../helper";
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
        const cleanPath = file.path.replace(/\\/g, "/");
        const imageUrl = `${backendUrl ? `${backendUrl}/` : ""}${cleanPath}`;
        uploadedImages.push(imageUrl);
      });
    }

    if (hasPdf) {
      req.files.pdf.forEach((file) => {
        const cleanPath = file.path.replace(/\\/g, "/");
        const pdfUrl = `${backendUrl ? `${backendUrl}/` : ""}${cleanPath}`;
        uploadedPdfs.push(pdfUrl);
      });
    }

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage?.fileUploadSuccess, { images: uploadedImages, pdfs: uploadedPdfs }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, {}));
  }
};

export const deleteUploadedFile = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = deleteImageSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const { fileUrl } = value;

    const parsedUrl = url.parse(fileUrl);
    const pathParts = (parsedUrl.pathname || "").split("/").filter(Boolean);

    const allowedTypes = ["images", "pdfs"];
    const type = pathParts.find((p) => allowedTypes.includes(p));

    if (!type) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage?.unsupportedFileType, {}, {}));

    const filePath = path.join(process.cwd(), parsedUrl.pathname.replace(/^\//, ""));

    if (!fs.existsSync(filePath)) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage?.getDataNotFound(type), {}, {}));

    fs.unlinkSync(filePath);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage?.deleteDataSuccess(type), {}, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, {}));
  }
};

export const getAllImages = async (req, res) => {
  reqInfo(req);
  try {
    const images = fs.readdirSync("public/images").map((file) => `${process.env.BACKEND_URL}/public/images/${file}`);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage?.getDataSuccess("Images"), images, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, {}));
  }
};

export const getAllPdfs = async (req, res) => {
  reqInfo(req);
  try {
    const pdfs = fs.readdirSync("public/pdfs").map((file) => `${process.env.BACKEND_URL}/public/pdfs/${file}`);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage?.getDataSuccess("PDFs"), pdfs, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, {}));
  }
};
