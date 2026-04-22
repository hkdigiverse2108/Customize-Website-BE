import { getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { blogModel, storeModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData, validate, verifyStoreAccess, checkFieldDuplicate, checkBlogLimit, verifyThemeForStore } from "../../helper";
import { apiResponse } from "../../type";
import { createBlogSchema, getAllBlogsQuerySchema, updateBlogSchema } from "../../validation";

export const createBlog = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createBlogSchema, req.body, res);
    if (!value) return;

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, value.storeId)) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));

    const blogLimitCheck = await checkBlogLimit(user, value.storeId);
    if (!blogLimitCheck.allowed) return res.status(HTTP_STATUS.PAYMENT_REQUIRED).json(apiResponse(HTTP_STATUS.PAYMENT_REQUIRED, blogLimitCheck.message, blogLimitCheck, {}));

    if (value.themeId) {
        if (!await verifyThemeForStore(value.storeId, value.themeId)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Theme not purchased for this store", {}, {}));
        }
    }

    if (await checkFieldDuplicate(blogModel, "seo.slug", value.seo.slug, undefined, { storeId: value.storeId })) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, "Blog slug already exists in this store", {}, {}));
    }

    const created = await new blogModel(value).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Blog"), created, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateBlog = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(updateBlogSchema, req.body, res);
    if (!value) return;

    const existing: any = await getFirstMatch(blogModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Blog"), {}, {}));

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, existing.storeId)) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));

    if (value.themeId) {
        if (!await verifyThemeForStore(existing.storeId, value.themeId)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Theme not purchased for this store", {}, {}));
        }
    }

    if (value.seo?.slug && await checkFieldDuplicate(blogModel, "seo.slug", value.seo.slug, value.id, { storeId: existing.storeId })) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, "Blog slug already exists", {}, {}));
    }

    const updated = await updateData(blogModel, { _id: value.id }, value, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Blog"), updated, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteBlog = async (req, res) => {
  reqInfo(req);
  try {
    const { id } = req.params;
    const existing: any = await getFirstMatch(blogModel, { _id: id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Blog"), {}, {}));

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, existing.storeId)) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));

    const deleted = await deleteData(blogModel, { _id: id }, { status: "hidden", isActive: false }, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Blog"), deleted, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getBlogs = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(getAllBlogsQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["title", "content", "author"]);
    if (value.storeId) criteria.storeId = value.storeId;
    if (value.status) criteria.status = value.status;
    if (value.blogCategory) criteria.blogCategory = value.blogCategory;
    criteria.isDeleted = { $ne: true };

    const blogs = await getData(blogModel, criteria, {}, options);
    const total = await countData(blogModel, criteria);

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", { blogs, state: getPaginationState(total, page, limit), total_count: total }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getBlogById = async (req, res) => {
    reqInfo(req);
    try {
        const { id } = req.params;
        const blog = await getFirstMatch(blogModel, { _id: id, isDeleted: { $ne: true } }, {}, {});
        if (!blog) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Blog"), {}, {}));
        return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", blog, {}));
    } catch (error) {
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};


