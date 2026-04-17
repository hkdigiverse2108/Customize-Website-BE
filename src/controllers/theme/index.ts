import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { settingModel, storeModel, themeModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { createThemeSchema, customizeThemeSchema, getAllThemesQuerySchema, themeIdSchema, updateThemeSchema } from "../../validation";


export const createTheme = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = createThemeSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const payload: any = { ...value };

    if (!payload.createdBy && loggedInUser?.role === ACCOUNT_TYPE.ADMIN) payload.createdBy = loggedInUser?._id;

    const existingTheme = await getFirstMatch(themeModel, { slug: payload.slug, isDeleted: { $ne: true } }, {}, {});
    if (existingTheme) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));

    const createdTheme = await new themeModel(payload).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Theme"), createdTheme, {}));
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateField = getDuplicateFieldFromError(error);
      return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist(duplicateField), {}, {}));
    }

    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateTheme = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...updatePayload } = req.body;
    const { error: idError, value: idValue } = themeIdSchema.validate({ id });
    if (idError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, idError?.details[0]?.message, {}, {}));

    const { error: bodyError, value: bodyValue } = updateThemeSchema.validate(updatePayload);
    if (bodyError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, bodyError?.details[0]?.message, {}, {}));

    const existingTheme = await getFirstMatch(themeModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {});
    if (!existingTheme) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Theme"), {}, {}));

    const nextSlug = bodyValue?.slug || existingTheme.slug;

    const duplicateTheme = await getFirstMatch(themeModel, { _id: { $ne: idValue.id }, slug: nextSlug, isDeleted: { $ne: true } }, {}, {});
    if (duplicateTheme) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("slug"), {}, {}));

    const updatedTheme = await updateData(themeModel, { _id: idValue.id, isDeleted: { $ne: true } }, bodyValue, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Theme"), updatedTheme, {}));
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateField = getDuplicateFieldFromError(error);
      return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist(duplicateField), {}, {}));
    }

    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteTheme = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = themeIdSchema.validate(req.params);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

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
    const { error, value } = getAllThemesQuerySchema.validate(req.query);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["name", "slug", "category", "authorName", "tags"]);

    if (value?.isPremiumFilter === true) criteria.isPremium = true;
    else if (value?.isPremiumFilter === false) criteria.isPremium = false;

    if (value?.category) criteria.category = value.category;
    if (value?.tag) criteria.tags = { $in: [value.tag] };
    if (value?.supportedPage) criteria.supportedPages = { $in: [value.supportedPage] };
    if (value?.createdBy) criteria.createdBy = value.createdBy;

    const loggedInUser = req.headers.user as any;
    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) criteria.isActive = true;

    const themes = await getData(themeModel, criteria, {}, options);
    const totalCount = await countData(themeModel, criteria);
    const pagination = getPaginationState(totalCount, Number(page), Number(limit));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Themes"), { themes, ...pagination, total_count: totalCount }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getThemeById = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = themeIdSchema.validate(req.params);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

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

export const customizeTheme = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = customizeThemeSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;

    const existingStore = await getFirstMatch(
      storeModel,
      { _id: value.storeId, userId: loggedInUser?._id, isDeleted: { $ne: true } },
      {},
      {}
    );
    if (!existingStore) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));

    const existingTheme = await getFirstMatch(
      themeModel,
      { _id: value.themeId, isDeleted: { $ne: true }, isActive: true },
      {},
      {}
    );
    if (!existingTheme) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Theme"), {}, {}));

    const updatePayload: any = { themeId: String(value.themeId) };
    if (value.themeConfig !== undefined) updatePayload.themeConfig = value.themeConfig;

    const existingSetting = await getFirstMatch(settingModel, { storeId: value.storeId, isDeleted: { $ne: true } }, {}, {});

    if (existingSetting) {
      const updatedSetting = await updateData(
        settingModel,
        { _id: existingSetting._id, isDeleted: { $ne: true } },
        updatePayload,
        { runValidators: true }
      );
      return res.status(HTTP_STATUS.OK).json(
        apiResponse(
          HTTP_STATUS.OK,
          responseMessage.updateDataSuccess("Store theme"),
          { setting: updatedSetting, theme: existingTheme },
          {}
        )
      );
    }

    const createdSetting = await new settingModel({
      userId: null,
      storeId: value.storeId,
      ...updatePayload,
    }).save();

    return res.status(HTTP_STATUS.CREATED).json(
      apiResponse(
        HTTP_STATUS.CREATED,
        responseMessage.addDataSuccess("Store theme"),
        { setting: createdSetting, theme: existingTheme },
        {}
      )
    );
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

const getDuplicateFieldFromError = (error: any) => {
  const keyPattern = error?.keyPattern || {};
  const keyValue = error?.keyValue || {};
  return Object.keys(keyPattern)[0] || Object.keys(keyValue)[0] || "value";
};
