import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { productModel, storeModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData, validate, checkFieldDuplicate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { createProductSchema, getAllProductsQuerySchema, productIdSchema, updateProductSchema } from "../../validation";

export const createProduct = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createProductSchema, req.body, res);
    if (!value) return;

    const user = req.headers.user as any;
    const payload: any = {
      ...value,
      tags: normalizeStringArray(value?.tags),
      hasVariants: value?.hasVariants === true || (Array.isArray(value?.variants) && value.variants.length > 0),
      options: Array.isArray(value?.options) ? value.options : [],
      variants: Array.isArray(value?.variants) ? value.variants : [],
      media: Array.isArray(value?.media) ? value.media : [],
      categoryIds: Array.isArray(value?.categoryIds) ? value.categoryIds : [],
      collectionIds: Array.isArray(value?.collectionIds) ? value.collectionIds : [],
      isActive: value?.isActive !== false,
      publishedAt: value?.publishedAt ? new Date(value.publishedAt) : (value.status === "active" ? new Date() : null),
    };

    if (payload.hasVariants && (!payload.variants || payload.variants.length === 0)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "variants are required when hasVariants is true", {}, {}));
    }

    if (!await verifyStoreAccess(user, payload.storeId)) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));
    }

    if (await checkFieldDuplicate(productModel, "slug", payload.slug)) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));
    }

    const created = await new productModel(payload).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Product"), created, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateProduct = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...body } = req.body;
    const idValue = validate(productIdSchema, { id }, res);
    if (!idValue) return;

    const value = validate(updateProductSchema, body, res);
    if (!value) return;

    const existing: any = await getFirstMatch(productModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Product"), {}, {}));

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, String(existing.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Product"), {}, {}));
    }

    const payload: any = { ...value };
    if (payload?.tags) payload.tags = normalizeStringArray(payload.tags);

    if (payload.slug && await checkFieldDuplicate(productModel, "slug", payload.slug, idValue.id)) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));
    }

    const updated = await updateData(productModel, { _id: idValue.id, isDeleted: { $ne: true } }, payload, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Product"), updated, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteProduct = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(productIdSchema, req.params, res);
    if (!value) return;

    const existing: any = await getFirstMatch(productModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Product"), {}, {}));

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, String(existing.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Product"), {}, {}));
    }

    const deleted = await deleteData(productModel, { _id: value.id }, { isActive: false, status: "archived" }, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Product"), deleted, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getProducts = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(getAllProductsQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["title", "slug", "vendor", "productType"]);

    const user = req.headers.user as any;
    if (user?.role === ACCOUNT_TYPE.VENDOR) {
      criteria.storeId = await getVendorStoreIds(user._id);
    }

    const [products, total] = await Promise.all([
        getData(productModel, criteria, {}, options),
        countData(productModel, criteria)
    ]);
    
    const pagination = getPaginationState(total, Number(page), Number(limit));
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Products"), { products, state: pagination, total_count: total }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getProductById = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(productIdSchema, req.params, res);
    if (!value) return;

    const product: any = await getFirstMatch(productModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!product) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Product"), {}, {}));

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, String(product.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Product"), {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Product"), product, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

const normalizeStringArray = (items: any = []) => {
    if (!Array.isArray(items)) return [];
    return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
};

const getVendorStoreIds = async (userId: string) => {
    const stores = await getData(storeModel, { userId, isDeleted: { $ne: true } }, { _id: 1 }, {});
    return { $in: stores.map((s) => s._id) };
};


