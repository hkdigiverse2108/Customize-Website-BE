import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { discountModel, storeModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { createDiscountSchema, discountIdSchema, getAllDiscountsQuerySchema, updateDiscountSchema } from "../../validation";

export const createDiscount = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createDiscountSchema, req.body, res);
    if (!value) return;

    const user = req.headers.user;
    const store = await findOne(storeModel, getStoreCriteria(user, value.storeId));
    if (!store) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"));

    const duplicate = await findOne(discountModel, { storeId: value.storeId, code: value.code, isDeleted: { $ne: true } });
    if (duplicate) return sendError(res, HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("code"));

    const created = await new discountModel(value).save();

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Discount"), created, {}));
  } catch (error) {
    return handleMongoError(res, error);
  }
};

export const updateDiscount = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...body } = req.body;

    const idValue = validate(discountIdSchema, { id }, res);
    if (!idValue) return;

    const value = validate(updateDiscountSchema, body, res);
    if (!value) return;

    const existing = await findOne(discountModel, { _id: idValue.id, isDeleted: { $ne: true } });
    if (!existing) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Discount"));

    const user = req.headers.user;
    const store = await findOne(storeModel, getStoreCriteria(user, String(existing.storeId)));
    if (!store) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Discount"));

    if (value.code) {
      const duplicate = await findOne(discountModel, { storeId: existing.storeId, code: value.code, _id: { $ne: idValue.id }, isDeleted: { $ne: true } });
      if (duplicate) return sendError(res, HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("code"));
    }

    const updated = await updateData(discountModel, { _id: idValue.id, isDeleted: { $ne: true } }, value, {});

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Discount"), updated, {}));
  } catch (error) {
    return handleMongoError(res, error);
  }
};

export const deleteDiscount = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(discountIdSchema, req.params, res);
    if (!value) return;

    const existing = await findOne(discountModel, { _id: value.id, isDeleted: { $ne: true } });
    if (!existing) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Discount"));

    const user = req.headers.user;
    const store = await findOne(storeModel, getStoreCriteria(user, String(existing.storeId)));
    if (!store) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Discount"));

    const deleted = await deleteData(discountModel, { _id: value.id }, { isActive: false }, {});

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Discount"), deleted, {}));
  } catch (error) {
    return handleMongoError(res, error);
  }
};

export const getDiscounts = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(getAllDiscountsQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["title", "code"]);

    if (value?.storeId) criteria.storeId = value.storeId;
    if (value?.isActive !== undefined) criteria.isActive = value.isActive;
    if (value?.type) criteria.type = value.type;

    const user = req.headers.user as any;
    if (user?.role === ACCOUNT_TYPE.VENDOR) {
      const stores = await getData(storeModel, { userId: user._id, isDeleted: { $ne: true } }, { _id: 1 }, {});
      const storeIds = stores.map((store) => store._id);

      if (!storeIds.length) {
        return res.status(HTTP_STATUS.OK).json(
          apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Discounts"), {
            discounts: [],
            ...getPaginationState(0, Number(page), Number(limit)),
            total_count: 0,
          }, {})
        );
      }

      criteria.storeId = { $in: storeIds };
    }

    const discounts = await getData(discountModel, criteria, {}, options);
    const total = await countData(discountModel, criteria);
    const pagination = getPaginationState(total, Number(page), Number(limit));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Discounts"), { discounts, ...pagination, total_count: total }, {}));
  } catch (error) {
    return handleMongoError(res, error);
  }
};

export const getDiscountById = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(discountIdSchema, req.params, res);
    if (!value) return;

    const discount = await findOne(discountModel, { _id: value.id, isDeleted: { $ne: true } });
    if (!discount) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Discount"));

    const user = req.headers.user;
    const store = await findOne(storeModel, getStoreCriteria(user, String(discount.storeId)));
    if (!store) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Discount"));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Discount"), discount, {}));
  } catch (error) {
    return handleMongoError(res, error);
  }
};

const sendError = (res, status, message, error = {}) => res.status(status).json(apiResponse(status, message, {}, error));

const validate = (schema, data, res) => {
  const { error, value } = schema.validate(data);
  if (error) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, error.details[0].message);
    return null;
  }
  return value;
};

const handleMongoError = (res, error) => {
  if (error?.code === 11000) return sendError(res, HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("code"));

  console.error(error);
  return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, error);
};

const findOne = (model, query) => getFirstMatch(model, query, {}, {});

const getStoreCriteria = (user, storeId) => ({
  _id: storeId,
  isDeleted: { $ne: true },
  ...(user?.role === ACCOUNT_TYPE.VENDOR && { userId: user._id }),
});
