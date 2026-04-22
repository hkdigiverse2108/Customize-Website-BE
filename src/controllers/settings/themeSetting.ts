import { HTTP_STATUS } from "../../common";
import { themeSettingModel } from "../../database/models/settings/themeSetting";
import { handlePostUpdate, reqInfo, responseMessage, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { publishThemeSchema, getThemeSettingSchema, upsertThemeSettingSchema } from "../../validation/settings/themeSetting";
import { storeModel } from "../../database";

export const getThemeSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(getThemeSettingSchema, req.query, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const filter: any = { storeId: val.storeId, isDeleted: false };
    if (val.themeId) {
      filter.themeId = val.themeId;
    } else {
      filter.isPublished = true;
    }

    const setting = await themeSettingModel.findOne(filter).populate("themeId");
    if (!setting) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, val.themeId ? "Theme settings not found for this theme" : "No published theme found for this store", {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", setting, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const upsertThemeSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(upsertThemeSettingSchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const store = await storeModel.findOne({ _id: val.storeId, isDeleted: false });
    if (!store) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));

    if (!store.themeIds.some(id => id.toString() === val.themeId.toString())) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, "This store has not purchased or been granted this theme.", {}, {}));
    }

    const filter = { storeId: val.storeId, themeId: val.themeId, isDeleted: false };
    const existing = await themeSettingModel.findOne(filter);

    let result;
    if (existing) {
      // Don't let upsert override isPublished flag
      const { isPublished, ...updateData } = val as any;
      result = await themeSettingModel.findOneAndUpdate(filter, updateData, { new: true });
      await handlePostUpdate({ user, action: "update", resourceType: "themeSetting", resourceId: String(result._id), oldData: existing, newData: result, storeId: val.storeId, req });
    } else {
      // First theme is auto-published
      const count = await themeSettingModel.countDocuments({ storeId: val.storeId, isDeleted: false });
      if (count === 0) val.isPublished = true;
      
      result = await new themeSettingModel(val).save();
      await handlePostUpdate({ user, action: "create", resourceType: "themeSetting", resourceId: String(result._id), newData: result, storeId: val.storeId, req });
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Theme settings updated successfully", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const publishTheme = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(publishThemeSchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const settingToPublish = await themeSettingModel.findOne({ storeId: val.storeId, themeId: val.themeId, isDeleted: false });
    if (!settingToPublish) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Theme settings not found for this theme. Please save theme settings first.", {}, {}));
    }

    // Unpublish all other themes for this store
    await themeSettingModel.updateMany({ storeId: val.storeId, isDeleted: false }, { isPublished: false });
    
    // Publish the selected one
    settingToPublish.isPublished = true;
    await settingToPublish.save();

    await handlePostUpdate({ user, action: "update", resourceType: "themeSetting", resourceId: String(settingToPublish._id), oldData: { isPublished: false }, newData: settingToPublish, storeId: val.storeId, req });

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Theme published successfully", settingToPublish, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
