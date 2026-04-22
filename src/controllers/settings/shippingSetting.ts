import { HTTP_STATUS } from "../../common";
import { shippingSettingModel } from "../../database/models/settings/shippingSetting";
import { handlePostUpdate, reqInfo, responseMessage, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { addShippingSettingSchema, deleteShippingSettingSchema, getShippingSettingsQuerySchema, updateShippingSettingSchema } from "../../validation/settings/shippingSetting";

export const addShippingSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(addShippingSettingSchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const result = await new shippingSettingModel(val).save();
    await handlePostUpdate({ user, action: "create", resourceType: "shippingSetting", resourceId: String(result._id), newData: result, storeId: val.storeId, req });

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, "Shipping zone added successfully", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getShippingSettings = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(getShippingSettingsQuerySchema, req.query, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const settings = await shippingSettingModel.find({ storeId: val.storeId, isDeleted: false });
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", settings, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateShippingSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(updateShippingSettingSchema, req.body, res);
    if (!val) return;

    const existing: any = await shippingSettingModel.findOne({ _id: val.shippingSettingId, isDeleted: false });
    if (!existing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Shipping zone not found", {}, {}));
    }

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, String(existing.storeId)))) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
    }

    const result = await shippingSettingModel.findOneAndUpdate({ _id: val.shippingSettingId }, val, { new: true });
    await handlePostUpdate({ user, action: "update", resourceType: "shippingSetting", resourceId: String(result._id), oldData: existing, newData: result, storeId: String(existing.storeId), req });

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Shipping zone updated successfully", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteShippingSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(deleteShippingSettingSchema, req.body, res);
    if (!val) return;

    const existing: any = await shippingSettingModel.findOne({ _id: val.shippingSettingId, isDeleted: false });
    if (!existing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Shipping zone not found", {}, {}));
    }

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, String(existing.storeId)))) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
    }

    const result = await shippingSettingModel.findOneAndUpdate({ _id: val.shippingSettingId }, { isDeleted: true }, { new: true });
    await handlePostUpdate({ user, action: "delete", resourceType: "shippingSetting", resourceId: String(result._id), oldData: existing, storeId: String(existing.storeId), req });

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Shipping zone deleted successfully", {}, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
