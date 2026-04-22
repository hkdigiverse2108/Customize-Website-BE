import { HTTP_STATUS } from "../../common";
import { regionSettingModel } from "../../database/models/settings/regionSetting";
import { handlePostUpdate, reqInfo, responseMessage, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { getRegionSettingSchema, upsertRegionSettingSchema } from "../../validation/settings/regionSetting";

export const getRegionSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(getRegionSettingSchema, req.query, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const setting = await regionSettingModel.findOne({ storeId: val.storeId, isDeleted: false });
    if (!setting) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Region settings not found", {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", setting, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const upsertRegionSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(upsertRegionSettingSchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const filter = { storeId: val.storeId, isDeleted: false };
    const existing = await regionSettingModel.findOne(filter);

    let result;
    if (existing) {
      result = await regionSettingModel.findOneAndUpdate(filter, val, { new: true });
      await handlePostUpdate({ user, action: "update", resourceType: "regionSetting", resourceId: String(result._id), oldData: existing, newData: result, storeId: val.storeId, req });
    } else {
      result = await new regionSettingModel(val).save();
      await handlePostUpdate({ user, action: "create", resourceType: "regionSetting", resourceId: String(result._id), newData: result, storeId: val.storeId, req });
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Region settings updated successfully", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
