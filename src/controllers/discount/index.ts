import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { discountModel, storeModel } from "../../database";
import { cacheService, countData, deleteData, getData, getFirstMatch, handlePostUpdate, reqInfo, responseMessage, updateData, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { createDiscountSchema, discountIdSchema, getAllDiscountsQuerySchema, updateDiscountSchema } from "../../validation";

export const createDiscount = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(createDiscountSchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, val.storeId)) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));

    const duplicate = await getFirstMatch(discountModel, { storeId: val.storeId, code: val.code, isDeleted: { $ne: true } }, {}, {});
    if (duplicate) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, "Code already exists", {}, {}));

    const created = await new discountModel(val).save();
    await handlePostUpdate({ user, action: "create", resourceType: "discount", resourceId: String(created._id), newData: created, storeId: val.storeId, req });

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Discount"), created, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateDiscount = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...body } = req.body;
    const idVal = validate(discountIdSchema, { id }, res);
    const val = validate(updateDiscountSchema, body, res);
    if (!idVal || !val) return;

    const existing: any = await getFirstMatch(discountModel, { _id: idVal.id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Discount not found", {}, {}));

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, String(existing.storeId))) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));

    if (val.code) {
      const duplicate = await getFirstMatch(discountModel, { storeId: existing.storeId, code: val.code, _id: { $ne: idVal.id }, isDeleted: { $ne: true } }, {}, {});
      if (duplicate) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, "Code already exists", {}, {}));
    }

    const updated = await updateData(discountModel, { _id: idVal.id }, val, {});
    await handlePostUpdate({ user, action: "update", resourceType: "discount", resourceId: idVal.id, oldData: existing, newData: updated, storeId: String(existing.storeId), req });

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Discount"), updated, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteDiscount = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(discountIdSchema, req.params, res);
    if (!val) return;

    const existing: any = await getFirstMatch(discountModel, { _id: val.id, isDeleted: { $ne: true } }, {}, {});
    if (!existing || !await verifyStoreAccess(req.headers.user, String(existing?.storeId))) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Discount not found", {}, {}));

    const deleted = await deleteData(discountModel, { _id: val.id }, { isActive: false }, {});
    await handlePostUpdate({ user: req.headers.user, action: "delete", resourceType: "discount", resourceId: val.id, oldData: existing, storeId: String(existing.storeId), req });

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Discount"), deleted, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getDiscounts = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(getAllDiscountsQuerySchema, req.query, res);
    if (!val) return;

    const cacheKey = `discounts_${JSON.stringify(req.query)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", cached, {}));

    const { criteria, options, page, limit } = resolveSortAndFilter(val, ["title", "code"]);
    if (val.storeId) criteria.storeId = val.storeId;
    if (val.isActive !== undefined) criteria.isActive = val.isActive;
    if (val.type) criteria.type = val.type;

    const user = req.headers.user as any;
    if (user?.role === ACCOUNT_TYPE.VENDOR) {
      const stores = await getStoreIds(user);
      if (!stores.length) return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", { discounts: [], ...getPaginationState(0, page, limit), total_count: 0 }, {}));
      criteria.storeId = { $in: stores };
    }

    const discounts = await getData(discountModel, criteria, {}, options);
    const total = await countData(discountModel, criteria);
    const result = { discounts, ...getPaginationState(total, page, limit), total_count: total };

    await cacheService.set(cacheKey, result, 300);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getDiscountById = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(discountIdSchema, req.params, res);
    if (!val) return;

    const discount: any = await getFirstMatch(discountModel, { _id: val.id, isDeleted: { $ne: true } }, {}, {});
    if (!discount || !await verifyStoreAccess(req.headers.user, String(discount?.storeId))) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Discount not found", {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", discount, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

const getStoreIds = async (user: any) => {
  const stores = await getData(storeModel, { userId: user._id, isDeleted: { $ne: true } }, { _id: 1 }, {});
  return stores.map(s => String(s._id));
};
