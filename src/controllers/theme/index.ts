import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { themeModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData, validate, checkFieldDuplicate } from "../../helper";
import { apiResponse } from "../../type";
import { THEME_SUPPORTED_PAGES } from "../../type/theme";
import { createThemeSchema, getAllThemesQuerySchema, themeIdSchema, updateThemeSchema } from "../../validation";

const normalizeThemeSupportedPages = (payload: any) => {
  const hasSupportedPages = Object.prototype.hasOwnProperty.call(payload, "supportedPages");
  const layoutJSON = payload.layoutJSON || {};
  const draftLayoutJSON = payload.draftLayoutJSON || {};
  const hasPageLayouts = THEME_SUPPORTED_PAGES.some((page) =>
    Object.prototype.hasOwnProperty.call(layoutJSON, page) || Object.prototype.hasOwnProperty.call(draftLayoutJSON, page)
  );

  if (!hasSupportedPages && !hasPageLayouts) return;

  const explicitPages = Array.isArray(payload.supportedPages) ? payload.supportedPages : [];
  const layoutPages = THEME_SUPPORTED_PAGES.filter(
    (page) => Object.prototype.hasOwnProperty.call(layoutJSON, page) || Object.prototype.hasOwnProperty.call(draftLayoutJSON, page)
  );

  payload.supportedPages = [...new Set([...explicitPages, ...layoutPages].map((page) => String(page).trim()).filter(Boolean))];
};

export const createTheme = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createThemeSchema, req.body, res);
    if (!value) return;

    const loggedInUser = req.headers.user as any;
    const payload: any = { ...value };

    if (!payload.createdBy && loggedInUser?.role === ACCOUNT_TYPE.ADMIN) payload.createdBy = loggedInUser?._id;
    normalizeThemeSupportedPages(payload);

    if (await checkFieldDuplicate(themeModel, "slug", payload.slug)) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));
    }

    const createdTheme = await new themeModel(payload).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Theme"), createdTheme, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateTheme = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...updatePayload } = req.body;
    const idValue = validate(themeIdSchema, { id }, res);
    if (!idValue) return;

    const bodyValue = validate(updateThemeSchema, updatePayload, res);
    if (!bodyValue) return;

    const existingTheme = await getFirstMatch(themeModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {});
    if (!existingTheme) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Theme"), {}, {}));

    if (bodyValue.slug && await checkFieldDuplicate(themeModel, "slug", bodyValue.slug, idValue.id)) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));
    }

    normalizeThemeSupportedPages(bodyValue);

    const updatedTheme = await updateData(themeModel, { _id: idValue.id, isDeleted: { $ne: true } }, bodyValue, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Theme"), updatedTheme, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteTheme = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(themeIdSchema, req.params, res);
    if (!value) return;

    const deletedTheme = await deleteData(themeModel, { _id: value.id, isDeleted: { $ne: true } }, { isActive: false }, {});
    if (!deletedTheme) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Theme"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Theme"), deletedTheme, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getThemes = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(getAllThemesQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["name", "slug", "description", "category", "authorName", "tags"]);

    if (value?.isPremiumFilter !== undefined) criteria.isPremium = value.isPremiumFilter;
    if (value?.storeId) criteria.storeId = value.storeId;
    if (value?.category) criteria.category = value.category;
    if (value?.tag) criteria.tags = { $in: [value.tag] };
    if (value?.supportedPage) criteria.supportedPages = { $in: [value.supportedPage] };
    if (value?.createdBy) criteria.createdBy = value.createdBy;

    const loggedInUser = req.headers.user as any;
    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) criteria.isActive = true;

    const [themes, totalCount] = await Promise.all([
        getData(themeModel, criteria, {}, options),
        countData(themeModel, criteria)
    ]);
    
    const pagination = getPaginationState(totalCount, Number(page), Number(limit));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Themes"), { themes, state: pagination, total_count: totalCount }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getThemeById = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(themeIdSchema, req.params, res);
    if (!value) return;

    const loggedInUser = req.headers.user as any;
    const criteria: any = { _id: value.id, isDeleted: { $ne: true } };
    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) criteria.isActive = true;

    const theme = await getFirstMatch(themeModel, criteria, {}, {});
    if (!theme) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Theme"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Theme"), theme, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};


