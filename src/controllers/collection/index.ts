import { ACCOUNT_TYPE, collectionTypes, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { collectionModel, storeModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { collectionIdSchema, createCollectionSchema, getAllCollectionsQuerySchema, updateCollectionSchema } from "../../validation";

export const createCollection = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createCollectionSchema, req.body, res);
    if (!value) return;

    const user = req.headers.user;
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

    if (!payload.handle)
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Invalid handle");

    const store = await findOne(storeModel, getStoreCriteria(user, payload.storeId));
    if (!store)
      return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"));

    const typeError = getTypeValidationError(payload.type, payload.productIds, payload.rules);
    if (typeError) return sendError(res, HTTP_STATUS.BAD_REQUEST, typeError);

    const duplicate = await findOne(collectionModel, getHandleDuplicateCriteria(payload.handle, payload.storeId));
    if (duplicate)
      return sendError(res, HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("handle"));

    const created = await new collectionModel(payload).save();

    return res.status(HTTP_STATUS.CREATED).json(
      apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Collection"), created, {})
    );
  } catch (error) {
    return handleMongoError(res, error);
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

    const existing = await findOne(collectionModel, { _id: idValue.id, isDeleted: { $ne: true } });
    if (!existing)
      return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Collection"));

    const user = req.headers.user;
    const store = await findOne(storeModel, getStoreCriteria(user, String(existing.storeId)));
    if (!store)
      return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Collection"));

    const payload = { ...value };

    const nextType = payload.type || existing.type;
    const nextProducts = payload.productIds ?? existing.productIds;
    const nextRules = payload.rules ?? existing.rules;

    const typeError = getTypeValidationError(nextType, nextProducts, nextRules);
    if (typeError) return sendError(res, HTTP_STATUS.BAD_REQUEST, typeError);

    const nextHandle = payload.handle || existing.handle;

    const duplicate = await findOne(collectionModel,getHandleDuplicateCriteria(nextHandle, existing.storeId, idValue.id));
    if (duplicate)
      return sendError(res, HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("handle"));

    const updated = await updateData(collectionModel,{ _id: idValue.id, isDeleted: { $ne: true } },payload,{});

    return res.status(HTTP_STATUS.OK).json(
      apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Collection"), updated, {})
    );
  } catch (error) {
    return handleMongoError(res, error);
  }
};

export const deleteCollection = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(collectionIdSchema, req.params, res);
    if (!value) return;

    const existing = await findOne(collectionModel, { _id: value.id, isDeleted: { $ne: true } });
    if (!existing)
      return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Collection"));

    const user = req.headers.user;
    const store = await findOne(storeModel, getStoreCriteria(user, String(existing.storeId)));
    if (!store)
      return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Collection"));

    const deleted = await deleteData(collectionModel,{ _id: value.id },{ isActive: false, status: "archived" },{});

    return res.status(HTTP_STATUS.OK).json(
      apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Collection"), deleted, {})
    );
  } catch (error) {
    return handleMongoError(res, error);
  }
};

export const getCollections = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(getAllCollectionsQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["title", "handle"]);

    if (value.storeId) criteria.storeId = value.storeId;
    if (value.typeFilter) criteria.type = value.typeFilter;

    const user = req.headers.user;

    if (user?.role === ACCOUNT_TYPE.VENDOR) {
      const stores = await getData(storeModel, { userId: user._id }, { _id: 1 }, {});
      const ids = stores.map((s) => s._id);

      if (!ids.length)
        return res.status(200).json(apiResponse(200, "Collections", { collections: [] }, {}));

      criteria.storeId = { $in: ids };
    }

    const collections = await getData(collectionModel, criteria, {}, options);
    const total = await countData(collectionModel, criteria);
    const pagination = getPaginationState(total, page, limit);

    return res.status(200).json(
      apiResponse(200, "Collections", { collections, ...pagination, total_count: total }, {})
    );
  } catch (error) {
    return handleMongoError(res, error);
  }
};

export const getCollectionById = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(collectionIdSchema, req.params, res);
    if (!value) return;

    const collection = await findOne(collectionModel, { _id: value.id, isDeleted: { $ne: true } });
    if (!collection)
      return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Collection"));

    const user = req.headers.user;
    const store = await findOne(storeModel, getStoreCriteria(user, String(collection.storeId)));
    if (!store)
      return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Collection"));

    return res.status(200).json(apiResponse(200, "Collection", collection, {}));
  } catch (error) {
    return handleMongoError(res, error);
  }
};

const sendError = (res, status, message, error = {}) =>
  res.status(status).json(apiResponse(status, message, {}, error));

const validate = (schema, data, res) => {
  const { error, value } = schema.validate(data);
  if (error) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, error.details[0].message);
    return null;
  }
  return value;
};

const handleMongoError = (res, error) => {
  if (error?.code === 11000)
    return sendError(res, HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("handle"));

  console.error(error);
  return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, error);
};

const findOne = (model, query) => getFirstMatch(model, query, {}, {});

const getStoreCriteria = (user, storeId) => ({
  _id: storeId,
  isDeleted: { $ne: true },
  ...(user?.role === ACCOUNT_TYPE.VENDOR && { userId: user._id }),
});

const getTypeValidationError = (type, productIds = [], rules = []) => {
  if (type === collectionTypes.SMART && !rules.length)
    return "Smart collection requires at least one rule";

  return null;
};
const escapeRegex = (v = "") => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getHandleDuplicateCriteria = (handle, storeId, id?) => ({
  handle: { $regex: `^${escapeRegex(handle)}$`, $options: "i" },
  storeId,
  isDeleted: { $ne: true },
  ...(id && { _id: { $ne: id } }),
});
