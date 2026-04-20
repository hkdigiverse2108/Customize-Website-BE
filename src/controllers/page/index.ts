import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { pageModel, storeModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData, validate, verifyStoreAccess, checkFieldDuplicate } from "../../helper";
import { apiResponse } from "../../type";
import { createPageSchema, getAllPagesQuerySchema, pageIdSchema, updatePageSchema } from "../../validation";

export const createPage = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createPageSchema, req.body, res);
    if (!value) return;

    const loggedInUser = req.headers.user as any;
    if (!await verifyStoreAccess(loggedInUser, value.storeId)) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));
    }

    if (await checkFieldDuplicate(pageModel, "slug", value.slug, undefined, { storeId: value.storeId })) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));
    }

    const payload: any = { ...value };
    const errorMsg = validatePageLogic(payload);
    if (errorMsg) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, errorMsg, {}, {}));

    const createdPage = await new pageModel(payload).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Page"), createdPage, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updatePage = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...updatePayload } = req.body;
    const idValue = validate(pageIdSchema, { id }, res);
    if (!idValue) return;

    const bodyValue = validate(updatePageSchema, updatePayload, res);
    if (!bodyValue) return;

    const loggedInUser = req.headers.user as any;
    const existingPage: any = await getFirstMatch(pageModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {});
    if (!existingPage) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Page"), {}, {}));

    if (!await verifyStoreAccess(loggedInUser, String(existingPage.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Page"), {}, {}));
    }

    if (bodyValue.slug && await checkFieldDuplicate(pageModel, "slug", bodyValue.slug, idValue.id, { storeId: existingPage.storeId })) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));
    }

    const payload: any = { ...bodyValue };
    const errorMsg = validatePageLogic(payload, existingPage);
    if (errorMsg) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, errorMsg, {}, {}));

    const updatedPage = await updateData(pageModel, { _id: idValue.id, isDeleted: { $ne: true } }, payload, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Page"), updatedPage, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deletePage = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(pageIdSchema, req.params, res);
    if (!value) return;

    const existingPage: any = await getFirstMatch(pageModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!existingPage) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Page"), {}, {}));

    const loggedInUser = req.headers.user as any;
    if (!await verifyStoreAccess(loggedInUser, String(existingPage.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Page"), {}, {}));
    }

    const deletedPage = await deleteData(pageModel, { _id: value.id, isDeleted: { $ne: true } }, { isPublished: false, isHomePage: false, isDraft: true }, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Page"), deletedPage, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getPages = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(getAllPagesQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["title", "slug", "description"]);
    const loggedInUser = req.headers.user as any;

    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) {
      criteria.storeId = await getVendorStoreIds(loggedInUser._id);
    }

    const [pages, totalCount] = await Promise.all([
        getData(pageModel, criteria, {}, options),
        countData(pageModel, criteria)
    ]);
    
    const pagination = getPaginationState(totalCount, Number(page), Number(limit));
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Pages"), { pages, ...pagination, total_count: totalCount }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getPageById = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(pageIdSchema, req.params, res);
    if (!value) return;

    const page: any = await getFirstMatch(pageModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!page) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Page"), {}, {}));

    const loggedInUser = req.headers.user as any;
    if (!await verifyStoreAccess(loggedInUser, String(page.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Page"), {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Page"), page, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

const validatePageLogic = (payload: any, existingPage?: any) => {
  const isPublished = payload.isPublished !== undefined ? payload.isPublished : existingPage?.isPublished;
  const isDraft = payload.isDraft !== undefined ? payload.isDraft : existingPage?.isDraft;

  if (isPublished === true && isDraft === true) return "isDraft cannot be true when isPublished is true";

  const visibility = (payload.visibility || existingPage?.visibility || "public").toLowerCase();
  const password = payload.password !== undefined ? payload.password : existingPage?.password;

  if (visibility === "password" && !password) return "password is required when visibility is password";
  
  return null;
};

const getVendorStoreIds = async (userId: string) => {
    const stores = await getData(storeModel, { userId, isDeleted: { $ne: true } }, { _id: 1 }, {});
    return { $in: stores.map((s) => s._id) };
};
