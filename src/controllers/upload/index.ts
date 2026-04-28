import path from "path";
import { HTTP_STATUS } from "../../common";
import { reqInfo, responseMessage, validate } from "../../helper";
import { deleteImageSchema } from "../../validation";
import url from "url";
import fs from "fs";
import { apiResponse } from "../../type";

const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");

const managedFileRoots = {
  images: path.resolve(process.cwd(), "public/images"),
  pdfs: path.resolve(process.cwd(), "public/pdfs"),
  files: path.resolve(process.cwd(), "public/files"),
  others: path.resolve(process.cwd(), "public/others"),
} as const;

type ManagedFileType = keyof typeof managedFileRoots;

const buildPublicUrl = (filePath: string) => {
  const normalizedPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${backendUrl ? `${backendUrl}/` : "/"}${normalizedPath}`;
};

const collectUploadedUrls = (files: Array<{ path: string }> = []) => files.map((file) => buildPublicUrl(file.path));

const readFilesFromDir = (dir: string) => {
  const absoluteDir = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(absoluteDir)) return [];

  return fs.readdirSync(absoluteDir).map((file) => buildPublicUrl(path.posix.join(dir.replace(/\\/g, "/"), file)));
};

const resolveSafeFilePath = (fileUrl: string) => {
  const parsedUrl = url.parse(fileUrl);
  const pathname = (parsedUrl.pathname || "").replace(/\\/g, "/");
  const pathParts = pathname.split("/").filter(Boolean);
  const type = pathParts.find((part): part is ManagedFileType => Object.prototype.hasOwnProperty.call(managedFileRoots, part));

  if (!type) return null;

  const filePath = path.resolve(process.cwd(), pathname.replace(/^\/+/, ""));
  const allowedRoot = managedFileRoots[type];
  const allowedRootPrefix = allowedRoot.endsWith(path.sep) ? allowedRoot : `${allowedRoot}${path.sep}`;

  if (filePath !== allowedRoot && !filePath.startsWith(allowedRootPrefix)) return null;

  return { type, filePath };
};

export const uploadFile = async (req, res) => {
  reqInfo(req);
  try {
    const uploadedImages = collectUploadedUrls(req?.files?.images ?? []);
    const uploadedPdfs = collectUploadedUrls(req?.files?.pdf ?? []);
    const uploadedFiles = collectUploadedUrls([...(req?.files?.file ?? []), ...(req?.files?.files ?? [])]);

    if (!uploadedImages.length && !uploadedPdfs.length && !uploadedFiles.length) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage?.noFileUploaded, {}, {}));
    }

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage?.fileUploadSuccess, { images: uploadedImages, pdfs: uploadedPdfs, files: uploadedFiles }, {}));
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

    const target = resolveSafeFilePath(value.fileUrl);
    if (!target) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage?.unsupportedFileType, {}, {}));

    if (!fs.existsSync(target.filePath)) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage?.getDataNotFound("File"), {}, {}));

    fs.unlinkSync(target.filePath);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage?.deleteDataSuccess("File"), {}, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getAllImages = async (req, res) => {
  reqInfo(req);
  try {
    const images = readFilesFromDir("public/images");
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage?.getDataSuccess("Images"), images, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getAllPdfs = async (req, res) => {
  reqInfo(req);
  try {
    const pdfs = readFilesFromDir("public/pdfs");
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "PDFs successfully retrieved!", pdfs, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getAllFiles = async (req, res) => {
  reqInfo(req);
  try {
    const files = [...readFilesFromDir("public/files"), ...readFilesFromDir("public/others")];
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage?.getDataSuccess("Files"), files, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
