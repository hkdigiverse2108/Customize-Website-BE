import { ACCOUNT_TYPE, collectionTypes, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { collectionModel, storeModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData, validate, checkFieldDuplicate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { collectionIdSchema, createCollectionSchema, getAllCollectionsQuerySchema, updateCollectionSchema } from "../../validation";

export const createCollection = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createCollectionSchema, req.body, res);
    if (!value) return;

    const user = req.headers.user as any;
    const isPublished = value?.isPublished === true;
    const payload: any = {
      ...value,
      type: value?.type || collectionTypes.MANUAL,
      status: value?.status || (isPublished ? "active" : "draft"),
      isPublished,
      publishedAt: isPublished ? (value?.publishedAt ? new Date(value.publishedAt) : new Date()) : null,
      productIds: Array.isArray(value?.productIds) ? value.productIds : [],
      rules: Array.isArray(value?.rules) ? value.rules : [],
      tags: Array.isArray(value?.tags) ? value.tags : [],
      ruleCondition: value?.ruleCondition || "AND",
      sortOrder: value?.sortOrder || "manual",
      isActive: value?.isActive !== false,
    };

    if (payload.type === collectionTypes.SMART && !payload.rules.length) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Smart collection requires at least one rule", {}, {}));
    }

    if (!await verifyStoreAccess(user, payload.storeId)) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));
    }

    if (await checkFieldDuplicate(collectionModel, "handle", payload.handle)) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("handle"), {}, {}));
    }

    const created = await new collectionModel(payload).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Collection"), created, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateCollection = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...body } = req.body;
    const idValue = validate(collectionIdSchema, { id }, res);
    if (!idValue) return;

    const value = validate(updateCollectionSchema, body, res);
    if (!value) return;

    const existing: any = await getFirstMatch(collectionModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Collection"), {}, {}));

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, String(existing.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Collection"), {}, {}));
    }

    const payload = { ...value };
    if (payload.handle && await checkFieldDuplicate(collectionModel, "handle", payload.handle, idValue.id)) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("handle"), {}, {}));
    }

    const updated = await updateData(collectionModel, { _id: idValue.id, isDeleted: { $ne: true } }, payload, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Collection"), updated, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteCollection = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(collectionIdSchema, req.params, res);
    if (!value) return;

    const existing: any = await getFirstMatch(collectionModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Collection"), {}, {}));

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, String(existing.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Collection"), {}, {}));
    }

    const deleted = await deleteData(collectionModel, { _id: value.id }, { isActive: false, status: "archived" }, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Collection"), deleted, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getCollections = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(getAllCollectionsQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["title", "handle"]);
    const user = req.headers.user as any;

    if (user?.role === ACCOUNT_TYPE.VENDOR) {
      criteria.storeId = await getVendorStoreIds(user._id);
    }

    const [collections, total] = await Promise.all([
        getData(collectionModel, criteria, {}, options),
        countData(collectionModel, criteria)
    ]);
    
    const pagination = getPaginationState(total, Number(page), Number(limit));
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Collections"), { collections, state: pagination, total_count: total }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getCollectionById = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(collectionIdSchema, req.params, res);
    if (!value) return;

    const collection: any = await getFirstMatch(collectionModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!collection) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Collection"), {}, {}));

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, String(collection.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Collection"), {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Collection"), collection, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

const getVendorStoreIds = async (userId: string) => {
    const stores = await getData(storeModel, { userId, isDeleted: { $ne: true } }, { _id: 1 }, {});
    return { $in: stores.map((s) => s._id) };
};


