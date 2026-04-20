import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { productModel, storeModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { createProductSchema, getAllProductsQuerySchema, productIdSchema, updateProductSchema } from "../../validation";

export const createProduct = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createProductSchema, req.body, res);
    if (!value) return;

    const user = req.headers.user;
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
      publishedAt: value?.publishedAt ? new Date(value.publishedAt) : null,
    };

    if (payload.status === "active" && !payload.publishedAt) payload.publishedAt = new Date();

    if (payload.hasVariants && payload.variants.length === 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "variants are required when hasVariants is true");
    }

    const store = await findOne(storeModel, getStoreCriteria(user, payload.storeId));
    if (!store) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"));

    const duplicate = await findOne(productModel, getSlugDuplicateCriteria(payload.slug, payload.storeId));
    if (duplicate) return sendError(res, HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"));

    const created = await new productModel(payload).save();

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Product"), created, {}));
  } catch (error) {
    return handleMongoError(res, error);
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

    const existing = await findOne(productModel, { _id: idValue.id, isDeleted: { $ne: true } });
    if (!existing) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Product"));

    const user = req.headers.user;
    const store = await findOne(storeModel, getStoreCriteria(user, String(existing.storeId)));
    if (!store) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Product"));

    const payload: any = { ...value };
    if (payload?.tags) payload.tags = normalizeStringArray(payload.tags);

    const nextSlug = payload?.slug || existing.slug;
    const duplicate = await findOne(productModel, getSlugDuplicateCriteria(nextSlug, existing.storeId, idValue.id));
    if (duplicate) return sendError(res, HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"));

    const nextVariants = payload.variants ?? existing.variants;
    const nextHasVariants = payload.hasVariants ?? existing.hasVariants;

    if (payload?.variants !== undefined && payload?.hasVariants === undefined) {
      payload.hasVariants = Array.isArray(payload.variants) && payload.variants.length > 0;
    }

    if (payload?.hasVariants === false && payload?.variants === undefined) {
      payload.variants = [];
    }

    if (nextHasVariants && (!Array.isArray(nextVariants) || nextVariants.length === 0)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "variants are required when hasVariants is true");
    }

    if (payload.status === "active" && payload.publishedAt === undefined && !existing.publishedAt) {
      payload.publishedAt = new Date();
    } else if (payload.publishedAt !== undefined) {
      payload.publishedAt = payload.publishedAt ? new Date(payload.publishedAt) : null;
    }

    const updated = await updateData(productModel, { _id: idValue.id, isDeleted: { $ne: true } }, payload, {});

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Product"), updated, {}));
  } catch (error) {
    return handleMongoError(res, error);
  }
};

export const deleteProduct = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(productIdSchema, req.params, res);
    if (!value) return;

    const existing = await findOne(productModel, { _id: value.id, isDeleted: { $ne: true } });
    if (!existing) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Product"));

    const user = req.headers.user;
    const store = await findOne(storeModel, getStoreCriteria(user, String(existing.storeId)));
    if (!store) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Product"));

    const deleted = await deleteData(productModel, { _id: value.id }, { isActive: false, status: "archived" }, {});

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Product"), deleted, {}));
  } catch (error) {
    return handleMongoError(res, error);
  }
};

export const getProducts = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(getAllProductsQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["title", "slug", "vendor", "productType"]);

    if (value?.storeId) criteria.storeId = value.storeId;
    if (value?.statusFilter) criteria.status = value.statusFilter;
    if (value?.vendorFilter) criteria.vendor = { $regex: escapeRegex(value.vendorFilter), $options: "i" };
    if (value?.productTypeFilter) criteria.productType = { $regex: escapeRegex(value.productTypeFilter), $options: "i" };
    if (value?.categoryId) criteria.categoryIds = value.categoryId;
    if (value?.collectionId) criteria.collectionIds = value.collectionId;
    if (value?.hasVariantsFilter === true) criteria.hasVariants = true;
    else if (value?.hasVariantsFilter === false) criteria.hasVariants = false;
    if (value?.tag) criteria.tags = { $regex: escapeRegex(value.tag), $options: "i" };

    if (value?.sortFilter === "priceAsc") options.sort = { price: 1 };
    else if (value?.sortFilter === "priceDesc") options.sort = { price: -1 };

    const user = req.headers.user as any;
    if (user?.role === ACCOUNT_TYPE.VENDOR) {
      const stores = await getData(storeModel, { userId: user._id, isDeleted: { $ne: true } }, { _id: 1 }, {});
      const storeIds = stores.map((store) => store._id);

      if (!storeIds.length) {
        return res.status(HTTP_STATUS.OK).json(
          apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Products"), {
            products: [],
            ...getPaginationState(0, Number(page), Number(limit)),
            total_count: 0,
          }, {})
        );
      }

      criteria.storeId = { $in: storeIds };
    }

    const products = await getData(productModel, criteria, {}, options);
    const total = await countData(productModel, criteria);
    const pagination = getPaginationState(total, Number(page), Number(limit));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Products"), { products, ...pagination, total_count: total }, {}));
  } catch (error) {
    return handleMongoError(res, error);
  }
};

export const getProductById = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(productIdSchema, req.params, res);
    if (!value) return;

    const product = await findOne(productModel, { _id: value.id, isDeleted: { $ne: true } });
    if (!product) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Product"));

    const user = req.headers.user;
    const store = await findOne(storeModel, getStoreCriteria(user, String(product.storeId)));
    if (!store) return sendError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Product"));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Product"), product, {}));
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
  if (error?.code === 11000) return sendError(res, HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"));

  console.error(error);
  return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, error);
};

const findOne = (model, query) => getFirstMatch(model, query, {}, {});

const getStoreCriteria = (user, storeId) => ({
  _id: storeId,
  isDeleted: { $ne: true },
  ...(user?.role === ACCOUNT_TYPE.VENDOR && { userId: user._id }),
});

const normalizeStringArray = (items: any = []) => {
  if (!Array.isArray(items)) return [];
  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
};

const escapeRegex = (value: string = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getSlugDuplicateCriteria = (slug: string, storeId: string, productId?: string) => ({
  slug: { $regex: `^${escapeRegex(slug)}$`, $options: "i" },
  storeId,
  isDeleted: { $ne: true },
  ...(productId && { _id: { $ne: productId } }),
});
