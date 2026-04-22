import { ACCOUNT_TYPE, HTTP_STATUS } from "../../common";
import { paymentSettingModel } from "../../database/models/settings/paymentSetting";
import { handlePostUpdate, reqInfo, responseMessage, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { getPaymentSettingSchema, upsertPaymentSettingSchema } from "../../validation/settings/paymentSetting";

export const getPaymentSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(getPaymentSettingSchema, req.query, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (val.isGlobal) {
      if (user?.role !== ACCOUNT_TYPE.ADMIN) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
      }
    } else if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const setting = await paymentSettingModel.findOne(val.isGlobal ? { isGlobal: true, isDeleted: false } : { storeId: val.storeId, isDeleted: false });
    if (!setting) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Payment settings not found", {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", setting, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const upsertPaymentSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(upsertPaymentSettingSchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (val.isGlobal) {
      if (user?.role !== ACCOUNT_TYPE.ADMIN) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
      }
    } else if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const filter = val.isGlobal ? { isGlobal: true, isDeleted: false } : { storeId: val.storeId, isDeleted: false };
    const existing = await paymentSettingModel.findOne(filter);

    let result;
    if (existing) {
      result = await paymentSettingModel.findOneAndUpdate(filter, val, { new: true });
      await handlePostUpdate({
        user,
        action: "update",
        resourceType: "paymentSetting",
        resourceId: String(result._id),
        oldData: existing,
        newData: result,
        storeId: val.isGlobal ? undefined : val.storeId,
        req,
      });
    } else {
      result = await new paymentSettingModel(val).save();
      await handlePostUpdate({
        user,
        action: "create",
        resourceType: "paymentSetting",
        resourceId: String(result._id),
        newData: result,
        storeId: val.isGlobal ? undefined : val.storeId,
        req,
      });
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Payment settings updated successfully", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
