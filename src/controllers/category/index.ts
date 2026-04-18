import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { categoryModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { categoryIdSchema, createCategorySchema, getAllCategoriesQuerySchema, updateCategorySchema } from "../../validation";

export const createCategory = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = createCategorySchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const existingCategory = await getFirstMatch(categoryModel, getNameDuplicateCriteria(value.name), {}, {});
    if (existingCategory) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("name"), {}, {}));

    const createdCategory = await new categoryModel(value).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Category"), createdCategory, {}));
  } catch (error) {

    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateCategory = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...updatePayload } = req.body;
    const { error: idError, value: idValue } = categoryIdSchema.validate({ id });
    if (idError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, idError?.details[0]?.message, {}, {}));

    const { error: bodyError, value: bodyValue } = updateCategorySchema.validate(updatePayload);
    if (bodyError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, bodyError?.details[0]?.message, {}, {}));

    const existingCategory: any = await getFirstMatch(categoryModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {});
    if (!existingCategory) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Category"), {}, {}));

    const nextName = bodyValue?.name || existingCategory.name;
    const duplicateCategory = await getFirstMatch(categoryModel, getNameDuplicateCriteria(nextName, idValue.id), {}, {});
    if (duplicateCategory) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("name"), {}, {}));

    const updatedCategory = await updateData(categoryModel, { _id: idValue.id, isDeleted: { $ne: true } }, bodyValue, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Category"), updatedCategory, {}));
  } catch (error) {

    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteCategory = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = categoryIdSchema.validate(req.params);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const deletedCategory = await deleteData(categoryModel, { _id: value.id, isDeleted: { $ne: true } }, { isActive: false }, {});
    if (!deletedCategory) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Category"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Category"), deletedCategory, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getCategories = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = getAllCategoriesQuerySchema.validate(req.query);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["name", "description"]);

    const loggedInUser = req.headers.user as any;
    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) {
      criteria.isActive = true;
    }

    const categories = await getData(categoryModel, criteria, {}, options);
    const totalCount = await countData(categoryModel, criteria);
    const pagination = getPaginationState(totalCount, Number(page), Number(limit));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Categories"), { categories, ...pagination, total_count: totalCount }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getCategoryById = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = categoryIdSchema.validate(req.params);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const category: any = await getFirstMatch(categoryModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Category"), {}, {}));
    }

    const loggedInUser = req.headers.user as any;
    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR && category?.isActive !== true) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Category"), {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Category"), category, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

const getNameDuplicateCriteria = (name: string, categoryId?: string) => {
  const criteria: any = {name: { $regex: `^${escapeRegex(name?.trim())}$`, $options: "i" },isDeleted: { $ne: true },};
  if (categoryId) criteria._id = { $ne: categoryId };
  return criteria;
};

const escapeRegex = (value: string = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
