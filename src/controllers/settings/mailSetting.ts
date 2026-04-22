import { HTTP_STATUS } from "../../common";
import { mailSettingModel } from "../../database/models/settings/mailSetting";
import { handlePostUpdate, reqInfo, responseMessage, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { getMailSettingSchema, upsertMailSettingSchema } from "../../validation/settings/mailSetting";

export const getMailSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(getMailSettingSchema, req.query, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const setting = await mailSettingModel.findOne({ storeId: val.storeId, isDeleted: false });
    if (!setting) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Mail settings not found", {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", setting, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const upsertMailSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(upsertMailSettingSchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const filter = { storeId: val.storeId, isDeleted: false };
    const existing = await mailSettingModel.findOne(filter);

    let result;
    if (existing) {
      result = await mailSettingModel.findOneAndUpdate(filter, val, { new: true });
      await handlePostUpdate({ user, action: "update", resourceType: "mailSetting", resourceId: String(result._id), oldData: existing, newData: result, storeId: val.storeId, req });
    } else {
      result = await new mailSettingModel(val).save();
      await handlePostUpdate({ user, action: "create", resourceType: "mailSetting", resourceId: String(result._id), newData: result, storeId: val.storeId, req });
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Mail settings updated successfully", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
