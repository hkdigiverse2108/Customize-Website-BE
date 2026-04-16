import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { storeModel, userModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { createStoreSchema, getAllStoresQuerySchema, storeIdSchema, updateStoreSchema } from "../../validation";

const normalizeStorePayload = (payload: any = {}) => {
  const normalizedPayload: any = { ...payload };

  if (typeof normalizedPayload.name === "string") normalizedPayload.name = normalizedPayload.name.trim();
  if (typeof normalizedPayload.slug === "string") normalizedPayload.slug = normalizedPayload.slug.trim().toLowerCase();
  if (typeof normalizedPayload.subdomain === "string") normalizedPayload.subdomain = normalizedPayload.subdomain.trim().toLowerCase();
  if (typeof normalizedPayload.customDomain === "string") {
    normalizedPayload.customDomain = normalizedPayload.customDomain.trim().toLowerCase();
    if (!normalizedPayload.customDomain) normalizedPayload.customDomain = null;
  }
  if (normalizedPayload.customDomain === "") normalizedPayload.customDomain = null;
  if (typeof normalizedPayload.panNumber === "string") normalizedPayload.panNumber = normalizedPayload.panNumber.trim().toUpperCase();
  if (typeof normalizedPayload.email === "string") normalizedPayload.email = normalizedPayload.email.trim().toLowerCase();
  if (typeof normalizedPayload.phone === "string") normalizedPayload.phone = normalizedPayload.phone.trim();

  return normalizedPayload;
};

const getDuplicateFieldFromError = (error: any) => {
  const keyPattern = error?.keyPattern || {};
  const keyValue = error?.keyValue || {};
  return Object.keys(keyPattern)[0] || Object.keys(keyValue)[0] || "value";
};

const checkStoreFieldDuplicate = async (field: string, value: any, storeId?: string) => {
  if (value === undefined || value === null || value === "") return null;

  const duplicateCriteria: any = { [field]: value, isDeleted: { $ne: true } };
  if (storeId) duplicateCriteria._id = { $ne: storeId };

  return getFirstMatch(storeModel, duplicateCriteria, {}, {});
};

export const createStore = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = createStoreSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const isStoreOwner = loggedInUser?.role === ACCOUNT_TYPE.STORE_OWNER;
    const payload: any = normalizeStorePayload({ ...value });

    if (isStoreOwner) payload.userId = loggedInUser?._id;
    if (!payload?.userId) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "userId is required", {}, {}));

    const existingUser = await getFirstMatch(userModel, { _id: payload.userId, isDeleted: { $ne: true } }, {}, {});
    if (!existingUser) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.getDataNotFound("User"), {}, {}));

    const duplicateSlug = await checkStoreFieldDuplicate("slug", payload.slug);
    if (duplicateSlug) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));

    const duplicateSubdomain = await checkStoreFieldDuplicate("subdomain", payload.subdomain);
    if (duplicateSubdomain) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("subdomain"), {}, {}));

    if (payload?.customDomain) {
      const duplicateCustomDomain = await checkStoreFieldDuplicate("customDomain", payload.customDomain);
      if (duplicateCustomDomain) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("custom domain"), {}, {}));
    }

    if (payload?.panNumber) {
      const duplicatePanNumber = await checkStoreFieldDuplicate("panNumber", payload.panNumber);
      if (duplicatePanNumber) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("pan number"), {}, {}));
    }

    const createdStore = await new storeModel(payload).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Store"), createdStore, {}));
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateField = getDuplicateFieldFromError(error);
      return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist(duplicateField), {}, {}));
    }

    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateStore = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...updatePayload } = req.body;
    const { error: idError, value: idValue } = storeIdSchema.validate({ id });
    if (idError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, idError?.details[0]?.message, {}, {}));

    const { error: bodyError, value: bodyValue } = updateStoreSchema.validate(updatePayload);
    if (bodyError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, bodyError?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const isStoreOwner = loggedInUser?.role === ACCOUNT_TYPE.STORE_OWNER;
    const criteria: any = { _id: idValue.id, isDeleted: { $ne: true } };
    if (isStoreOwner) criteria.userId = loggedInUser?._id;

    const existingStore: any = await getFirstMatch(storeModel, criteria, {}, {});
    if (!existingStore) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));

    const normalizedPayload: any = normalizeStorePayload(bodyValue);
    if (isStoreOwner) delete normalizedPayload.userId;

    if (normalizedPayload?.userId && String(normalizedPayload.userId) !== String(existingStore.userId)) {
      const userExists = await getFirstMatch(userModel, { _id: normalizedPayload.userId, isDeleted: { $ne: true } }, {}, {});
      if (!userExists) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.getDataNotFound("User"), {}, {}));
    }

    const nextSlug = normalizedPayload?.slug || existingStore.slug;
    const nextSubdomain = normalizedPayload?.subdomain || existingStore.subdomain;
    const nextCustomDomain = normalizedPayload.customDomain !== undefined ? normalizedPayload.customDomain : existingStore.customDomain;
    const nextPanNumber = normalizedPayload.panNumber !== undefined ? normalizedPayload.panNumber : existingStore.panNumber;

    const duplicateSlug = await checkStoreFieldDuplicate("slug", nextSlug, idValue.id);
    if (duplicateSlug) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));

    const duplicateSubdomain = await checkStoreFieldDuplicate("subdomain", nextSubdomain, idValue.id);
    if (duplicateSubdomain) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("subdomain"), {}, {}));

    if (nextCustomDomain) {
      const duplicateCustomDomain = await checkStoreFieldDuplicate("customDomain", nextCustomDomain, idValue.id);
      if (duplicateCustomDomain) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("custom domain"), {}, {}));
    }

    if (nextPanNumber) {
      const duplicatePanNumber = await checkStoreFieldDuplicate("panNumber", nextPanNumber, idValue.id);
      if (duplicatePanNumber) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("pan number"), {}, {}));
    }

    const updatedStore = await updateData(storeModel, criteria, normalizedPayload, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Store"), updatedStore, {}));
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateField = getDuplicateFieldFromError(error);
      return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist(duplicateField), {}, {}));
    }

    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteStore = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = storeIdSchema.validate(req.params);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const criteria: any = { _id: value.id, isDeleted: { $ne: true } };
    if (loggedInUser?.role === ACCOUNT_TYPE.STORE_OWNER) criteria.userId = loggedInUser?._id;

    const deletedStore = await deleteData(storeModel, criteria, { isActive: false, isPublished: false }, {});
    if (!deletedStore) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Store"), deletedStore, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getStores = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = getAllStoresQuerySchema.validate(req.query);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["name", "slug", "businessName", "email", "phone"]);

    if (value?.isPublishedFilter === true) criteria.isPublished = true;
    else if (value?.isPublishedFilter === false) criteria.isPublished = false;

    if (value?.isBlockedFilter === true) criteria.isBlocked = true;
    else if (value?.isBlockedFilter === false) criteria.isBlocked = false;

    if (value?.kycStatusFilter) criteria.kycStatus = value.kycStatusFilter;
    if (value?.userId) criteria.userId = value.userId;

    const loggedInUser = req.headers.user as any;
    if (loggedInUser?.role === ACCOUNT_TYPE.STORE_OWNER) criteria.userId = loggedInUser?._id;

    const stores = await getData(storeModel, criteria, {}, options);
    const totalCount = await countData(storeModel, criteria);
    const pagination = getPaginationState(totalCount, Number(page), Number(limit));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Stores"), { stores, ...pagination, total_count: totalCount }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getStoreById = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = storeIdSchema.validate(req.params);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const criteria: any = { _id: value.id, isDeleted: { $ne: true } };
    if (loggedInUser?.role === ACCOUNT_TYPE.STORE_OWNER) criteria.userId = loggedInUser?._id;

    const store = await getFirstMatch(storeModel, criteria, {}, {});
    if (!store) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Store"), store, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
