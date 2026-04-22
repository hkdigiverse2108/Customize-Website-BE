import { HTTP_STATUS } from "../../common";
import { domainSettingModel } from "../../database/models/settings/domainSetting";
import { handlePostUpdate, reqInfo, responseMessage, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { addDomainSettingSchema, deleteDomainSettingSchema, getDomainSettingsQuerySchema, updateDomainSettingSchema } from "../../validation/settings/domainSetting";

export const addDomainSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(addDomainSettingSchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    // Default DNS records (example)
    val.dnsRecords = [
      { type: "A", host: "@", value: "76.76.21.21" }, // Example IP
      { type: "CNAME", host: "www", value: "cname.example.com" }
    ];

    const result = await new domainSettingModel(val).save();
    await handlePostUpdate({ user, action: "create", resourceType: "domainSetting", resourceId: String(result._id), newData: result, storeId: val.storeId, req });

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, "Domain added successfully", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getDomainSettings = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(getDomainSettingsQuerySchema, req.query, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const settings = await domainSettingModel.find({ storeId: val.storeId, isDeleted: false });
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", settings, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateDomainSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(updateDomainSettingSchema, req.body, res);
    if (!val) return;

    const existing: any = await domainSettingModel.findOne({ _id: val.domainSettingId, isDeleted: false });
    if (!existing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Domain not found", {}, {}));
    }

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, String(existing.storeId)))) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
    }

    // If setting as primary, unset others
    if (val.isPrimary) {
      await domainSettingModel.updateMany({ storeId: existing.storeId, _id: { $ne: val.domainSettingId } }, { isPrimary: false });
    }

    const result = await domainSettingModel.findOneAndUpdate({ _id: val.domainSettingId }, val, { new: true });
    await handlePostUpdate({ user, action: "update", resourceType: "domainSetting", resourceId: String(result._id), oldData: existing, newData: result, storeId: String(existing.storeId), req });

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Domain updated successfully", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteDomainSetting = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(deleteDomainSettingSchema, req.body, res);
    if (!val) return;

    const existing: any = await domainSettingModel.findOne({ _id: val.domainSettingId, isDeleted: false });
    if (!existing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Domain not found", {}, {}));
    }

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, String(existing.storeId)))) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
    }

    const result = await domainSettingModel.findOneAndUpdate({ _id: val.domainSettingId }, { isDeleted: true }, { new: true });
    await handlePostUpdate({ user, action: "delete", resourceType: "domainSetting", resourceId: String(result._id), oldData: existing, storeId: String(existing.storeId), req });

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Domain deleted successfully", {}, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
