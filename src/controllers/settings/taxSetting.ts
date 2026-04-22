import { HTTP_STATUS } from "../../common";
import { taxSettingModel } from "../../database/models/settings/taxSetting";
import { handlePostUpdate, reqInfo, responseMessage, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { getTaxSettingSchema, upsertTaxSettingSchema } from "../../validation/settings/taxSetting";

export const getTaxSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(getTaxSettingSchema, req.query, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const setting = await taxSettingModel.findOne({ storeId: val.storeId, isDeleted: false });
    if (!setting) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Tax settings not found", {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", setting, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const upsertTaxSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(upsertTaxSettingSchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const filter = { storeId: val.storeId, isDeleted: false };
    const existing = await taxSettingModel.findOne(filter);

    let result;
    if (existing) {
      result = await taxSettingModel.findOneAndUpdate(filter, val, { new: true });
      await handlePostUpdate({ user, action: "update", resourceType: "taxSetting", resourceId: String(result._id), oldData: existing, newData: result, storeId: val.storeId, req });
    } else {
      result = await new taxSettingModel(val).save();
      await handlePostUpdate({ user, action: "create", resourceType: "taxSetting", resourceId: String(result._id), newData: result, storeId: val.storeId, req });
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Tax settings updated successfully", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
