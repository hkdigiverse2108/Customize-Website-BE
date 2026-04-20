import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { categoryModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData, validate, verifyStoreAccess, checkFieldDuplicate } from "../../helper";
import { apiResponse } from "../../type";
import { createCategorySchema, getAllCategoriesQuerySchema, updateCategorySchema } from "../../validation";

export const createCategory = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createCategorySchema, req.body, res);
    if (!value) return;

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, value.storeId)) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));

    if (await checkFieldDuplicate(categoryModel, "slug", value.slug, undefined, { storeId: value.storeId })) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, "Slug already exists in this store", {}, {}));
    }

    const created = await new categoryModel(value).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Category"), created, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateCategory = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(updateCategorySchema, req.body, res);
    if (!value) return;

    const existing: any = await getFirstMatch(categoryModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Category"), {}, {}));

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, existing.storeId)) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));

    if (value.slug && await checkFieldDuplicate(categoryModel, "slug", value.slug, value.id, { storeId: existing.storeId })) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, "Slug already exists", {}, {}));
    }

    const updated = await updateData(categoryModel, { _id: value.id }, value, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Category"), updated, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteCategory = async (req, res) => {
  reqInfo(req);
  try {
    const { id } = req.params;
    const existing: any = await getFirstMatch(categoryModel, { _id: id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Category"), {}, {}));

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, existing.storeId)) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));

    const deleted = await deleteData(categoryModel, { _id: id }, { isActive: false }, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Category"), deleted, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getCategories = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(getAllCategoriesQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["name"]);
    if (value.storeId) criteria.storeId = value.storeId;
    criteria.isDeleted = { $ne: true };

    const categories = await getData(categoryModel, criteria, {}, options);
    const total = await countData(categoryModel, criteria);

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", { categories, ...getPaginationState(total, page, limit), total_count: total }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};


