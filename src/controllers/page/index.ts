import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { pageModel, storeModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { createPageSchema, getAllPagesQuerySchema, pageIdSchema, updatePageSchema } from "../../validation";

export const createPage = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = createPageSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const existingStore = await getFirstMatch(storeModel, getStoreCriteria(loggedInUser, value.storeId), {}, {});
    if (!existingStore) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));

    const duplicateSlug = await getFirstMatch(pageModel, { storeId: value.storeId, slug: value.slug, isDeleted: { $ne: true } }, {}, {});
    if (duplicateSlug) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));

    if (value?.isHomePage === true) {
      const existingHomePage = await getFirstMatch(pageModel, { storeId: value.storeId, isHomePage: true, isDeleted: { $ne: true } }, {}, {});
      if (existingHomePage) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("homepage"), {}, {}));
    }

    const payload: any = { ...value };
    const publishStateError = normalizePagePublishState(payload);
    if (publishStateError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, publishStateError, {}, {}));
    }

    const visibilityError = normalizePageVisibility(payload);
    if (visibilityError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, visibilityError, {}, {}));
    }

    const createdPage = await new pageModel(payload).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Page"), createdPage, {}));
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateField = getDuplicateFieldFromError(error);
      return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist(duplicateField), {}, {}));
    }

    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updatePage = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...updatePayload } = req.body;
    const { error: idError, value: idValue } = pageIdSchema.validate({ id });
    if (idError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, idError?.details[0]?.message, {}, {}));

    const { error: bodyError, value: bodyValue } = updatePageSchema.validate(updatePayload);
    if (bodyError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, bodyError?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const existingPage: any = await getAccessiblePage(loggedInUser, idValue.id);
    if (!existingPage) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Page"), {}, {}));

    const payload: any = { ...bodyValue };
    const nextSlug = payload?.slug || existingPage.slug;

    const duplicateSlug = await getFirstMatch(
      pageModel,
      { _id: { $ne: idValue.id }, storeId: existingPage.storeId, slug: nextSlug, isDeleted: { $ne: true } },
      {},
      {}
    );
    if (duplicateSlug) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));

    if (payload?.isHomePage === true) {
      const existingHomePage = await getFirstMatch(
        pageModel,
        { _id: { $ne: idValue.id }, storeId: existingPage.storeId, isHomePage: true, isDeleted: { $ne: true } },
        {},
        {}
      );
      if (existingHomePage) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("homepage"), {}, {}));
    }

    const publishStateError = normalizePagePublishState(payload, existingPage);
    if (publishStateError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, publishStateError, {}, {}));
    }

    const visibilityError = normalizePageVisibility(payload, existingPage);
    if (visibilityError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, visibilityError, {}, {}));
    }

    const updatedPage = await updateData(pageModel, { _id: idValue.id, isDeleted: { $ne: true } }, payload, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Page"), updatedPage, {}));
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateField = getDuplicateFieldFromError(error);
      return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist(duplicateField), {}, {}));
    }

    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deletePage = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = pageIdSchema.validate(req.params);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const existingPage: any = await getAccessiblePage(loggedInUser, value.id);
    if (!existingPage) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Page"), {}, {}));

    const deletedPage = await deleteData(pageModel, { _id: value.id, isDeleted: { $ne: true } }, { isPublished: false, isHomePage: false, isDraft: true }, {});
    if (!deletedPage) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Page"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Page"), deletedPage, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getPages = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = getAllPagesQuerySchema.validate(req.query);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["title", "slug", "description"]);

    if (value?.type) criteria.type = value.type;
    if (value?.isPublishedFilter === true) criteria.isPublished = true;
    else if (value?.isPublishedFilter === false) criteria.isPublished = false;

    if (value?.isDraftFilter === true) criteria.isDraft = true;
    else if (value?.isDraftFilter === false) criteria.isDraft = false;

    if (value?.visibility) criteria.visibility = value.visibility;

    const loggedInUser = req.headers.user as any;
    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) {
      const vendorStores: any[] = await getData(storeModel, { userId: loggedInUser?._id, isDeleted: { $ne: true } }, { _id: 1 }, {});
      const storeIds = vendorStores.map((store) => store?._id);

      if (storeIds.length === 0) {
        return res.status(HTTP_STATUS.OK).json(
          apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Pages"), { pages: [], page: Number(page), limit: Number(limit) || 0, page_limit: 1, total_count: 0 }, {})
        );
      }

      if (value?.storeId) {
        const hasAccess = storeIds.some((id) => String(id) === String(value.storeId));
        if (!hasAccess) {
          return res.status(HTTP_STATUS.OK).json(
            apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Pages"), { pages: [], page: Number(page), limit: Number(limit) || 0, page_limit: 1, total_count: 0 }, {})
          );
        }
        criteria.storeId = value.storeId;
      } else {
        criteria.storeId = { $in: storeIds };
      }
    } else if (value?.storeId) {
      criteria.storeId = value.storeId;
    }

    const pages = await getData(pageModel, criteria, {}, options);
    const totalCount = await countData(pageModel, criteria);
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
    const { error, value } = pageIdSchema.validate(req.params);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const page: any = await getAccessiblePage(loggedInUser, value.id);
    if (!page) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Page"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Page"), page, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

const getDuplicateFieldFromError = (error: any) => {
  const keyPattern = error?.keyPattern || {};
  const keyValue = error?.keyValue || {};
  return Object.keys(keyPattern)[0] || Object.keys(keyValue)[0] || "value";
};

const getStoreCriteria = (loggedInUser: any, storeId: string) => {
  const criteria: any = { _id: storeId, isDeleted: { $ne: true } };
  if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) criteria.userId = loggedInUser?._id;
  return criteria;
};

const getAccessiblePage = async (loggedInUser: any, pageId: string) => {
  const page: any = await getFirstMatch(pageModel, { _id: pageId, isDeleted: { $ne: true } }, {}, {});
  if (!page) return null;

  const store = await getFirstMatch(storeModel, getStoreCriteria(loggedInUser, String(page.storeId)), {}, {});
  if (!store) return null;

  return page;
};

const normalizePageVisibility = (payload: any, existingPage?: any) => {
  const hasVisibilityInPayload = payload?.visibility !== undefined;
  const resolvedVisibility = String(hasVisibilityInPayload ? payload.visibility : existingPage?.visibility || "public")
    .trim()
    .toLowerCase();

  const hasPasswordInPayload = payload?.password !== undefined;
  const resolvedPassword = String(hasPasswordInPayload ? payload.password : existingPage?.password || "").trim();

  const shouldValidatePassword = !existingPage || hasVisibilityInPayload || hasPasswordInPayload;
  if (resolvedVisibility === "password" && shouldValidatePassword && !resolvedPassword) {
    return "password is required when visibility is password";
  }

  if (resolvedVisibility !== "password") {
    payload.password = "";
    return null;
  }

  if (hasPasswordInPayload) payload.password = resolvedPassword;
  return null;
};

const normalizePagePublishState = (payload: any, existingPage?: any) => {
  const hasPublishedInPayload = payload?.isPublished !== undefined;
  const hasDraftInPayload = payload?.isDraft !== undefined;

  const resolvedIsPublished = hasPublishedInPayload ? payload.isPublished : existingPage?.isPublished;
  const resolvedIsDraft = hasDraftInPayload ? payload.isDraft : existingPage?.isDraft;

  if (resolvedIsPublished === true && resolvedIsDraft === true) {
    return "isDraft cannot be true when isPublished is true";
  }

  if (hasPublishedInPayload && !hasDraftInPayload) payload.isDraft = !payload.isPublished;
  if (hasDraftInPayload && !hasPublishedInPayload) payload.isPublished = !payload.isDraft;

  return null;
};
