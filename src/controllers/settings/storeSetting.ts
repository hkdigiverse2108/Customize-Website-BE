import { HTTP_STATUS } from "../../common";
import { storeSettingModel } from "../../database/models/settings/storeSetting";
import { handlePostUpdate, reqInfo, responseMessage, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { getStoreSettingSchema, upsertStoreSettingSchema } from "../../validation/settings/storeSetting";

export const getStoreSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(getStoreSettingSchema, req.query, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const setting = await storeSettingModel.findOne({ storeId: val.storeId, isDeleted: false });
    if (!setting) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store settings not found", {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", setting, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const upsertStoreSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(upsertStoreSettingSchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const filter = { storeId: val.storeId, isDeleted: false };
    const existing = await storeSettingModel.findOne(filter);

    let result;
    if (existing) {
      result = await storeSettingModel.findOneAndUpdate(filter, val, { new: true });
      await handlePostUpdate({
        user,
        action: "update",
        resourceType: "storeSetting",
        resourceId: String(result._id),
        oldData: existing,
        newData: result,
        storeId: val.storeId,
        req,
      });
    } else {
      result = await new storeSettingModel(val).save();
      await handlePostUpdate({
        user,
        action: "create",
        resourceType: "storeSetting",
        resourceId: String(result._id),
        newData: result,
        storeId: val.storeId,
        req,
      });
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Store settings updated successfully", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
