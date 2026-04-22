import { HTTP_STATUS } from "../../common";
import { seoSettingModel } from "../../database/models/settings/seoSetting";
import { handlePostUpdate, reqInfo, responseMessage, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { getSEOSettingSchema, upsertSEOSettingSchema } from "../../validation/settings/seoSetting";

export const getSEOSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(getSEOSettingSchema, req.query, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const setting = await seoSettingModel.findOne({ storeId: val.storeId, isDeleted: false });
    if (!setting) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "SEO settings not found", {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", setting, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const upsertSEOSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(upsertSEOSettingSchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const filter = { storeId: val.storeId, isDeleted: false };
    const existing = await seoSettingModel.findOne(filter);

    let result;
    if (existing) {
      result = await seoSettingModel.findOneAndUpdate(filter, val, { new: true });
      await handlePostUpdate({ user, action: "update", resourceType: "seoSetting", resourceId: String(result._id), oldData: existing, newData: result, storeId: val.storeId, req });
    } else {
      result = await new seoSettingModel(val).save();
      await handlePostUpdate({ user, action: "create", resourceType: "seoSetting", resourceId: String(result._id), newData: result, storeId: val.storeId, req });
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "SEO settings updated successfully", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
