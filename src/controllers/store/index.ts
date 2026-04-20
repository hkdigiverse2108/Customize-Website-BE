import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { storeModel, userModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData, validate, checkFieldDuplicate } from "../../helper";
import { apiResponse } from "../../type";
import { createStoreSchema, getAllStoresQuerySchema, storeIdSchema, updateStoreSchema } from "../../validation";

export const createStore = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createStoreSchema, req.body, res);
    if (!value) return;

    const loggedInUser = req.headers.user as any;
    const isStoreOwner = loggedInUser?.role === ACCOUNT_TYPE.VENDOR;
    const payload: any = { ...value };

    if (isStoreOwner) payload.userId = loggedInUser?._id;
    if (!payload?.userId) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "userId is required", {}, {}));

    const existingUser = await getFirstMatch(userModel, { _id: payload.userId, isDeleted: { $ne: true } }, {}, {});
    if (!existingUser) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.getDataNotFound("User"), {}, {}));

    // Check Duplicates
    if (await checkFieldDuplicate(storeModel, "slug", payload.slug)) 
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));
    
    if (await checkFieldDuplicate(storeModel, "subdomain", payload.subdomain))
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("subdomain"), {}, {}));

    if (payload?.customDomain && await checkFieldDuplicate(storeModel, "customDomain", payload.customDomain))
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("custom domain"), {}, {}));

    const createdStore = await new storeModel(payload).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Store"), createdStore, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateStore = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...updatePayload } = req.body;
    const idValue = validate(storeIdSchema, { id }, res);
    if (!idValue) return;

    const bodyValue = validate(updateStoreSchema, updatePayload, res);
    if (!bodyValue) return;

    const loggedInUser = req.headers.user as any;
    const isStoreOwner = loggedInUser?.role === ACCOUNT_TYPE.VENDOR;
    const criteria: any = { _id: idValue.id, isDeleted: { $ne: true } };
    if (isStoreOwner) criteria.userId = loggedInUser?._id;

    const existingStore: any = await getFirstMatch(storeModel, criteria, {}, {});
    if (!existingStore) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));

    const payload: any = { ...bodyValue };
    if (isStoreOwner) delete payload.userId;

    // Check Duplicates if changed
    if (payload.slug && await checkFieldDuplicate(storeModel, "slug", payload.slug, idValue.id))
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));

    if (payload.subdomain && await checkFieldDuplicate(storeModel, "subdomain", payload.subdomain, idValue.id))
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("subdomain"), {}, {}));

    const updatedStore = await updateData(storeModel, criteria, payload, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Store"), updatedStore, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteStore = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(storeIdSchema, req.params, res);
    if (!value) return;

    const loggedInUser = req.headers.user as any;
    const criteria: any = { _id: value.id, isDeleted: { $ne: true } };
    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) criteria.userId = loggedInUser?._id;

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
    const value = validate(getAllStoresQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["name", "slug", "businessName", "email", "phone"]);

    if (value?.isPublishedFilter !== undefined) criteria.isPublished = value.isPublishedFilter;
    if (value?.isBlockedFilter !== undefined) criteria.isBlocked = value.isBlockedFilter;
    if (value?.kycStatusFilter) criteria.kycStatus = value.kycStatusFilter;

    const loggedInUser = req.headers.user as any;
    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) criteria.userId = loggedInUser?._id;

    const [stores, totalCount] = await Promise.all([
        getData(storeModel, criteria, {}, options),
        countData(storeModel, criteria)
    ]);
    
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
    const value = validate(storeIdSchema, req.params, res);
    if (!value) return;

    const loggedInUser = req.headers.user as any;
    const criteria: any = { _id: value.id, isDeleted: { $ne: true } };
    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) criteria.userId = loggedInUser?._id;

    const store = await getFirstMatch(storeModel, criteria, {}, {});
    if (!store) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Store"), store, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
