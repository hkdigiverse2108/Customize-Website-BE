import { ACCOUNT_TYPE, HTTP_STATUS } from "../../common";
import { settingModel, storeModel, userModel } from "../../database";
import { getFirstMatch, reqInfo, responseMessage, updateData, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { getStoreSettingSchema, upsertAdminSettingSchema, upsertStoreSettingSchema } from "../../validation";

export const getSetting = async (req, res) => {
  const loggedInUser = req.headers.user as any;
  if (loggedInUser?.role === ACCOUNT_TYPE.ADMIN) return getAdminSetting(req, res);
  if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) return getStoreSetting(req, res);
  return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
};

export const upsertSetting = async (req, res) => {
  const loggedInUser = req.headers.user as any;
  if (loggedInUser?.role === ACCOUNT_TYPE.ADMIN) return upsertAdminSetting(req, res);
  if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) return upsertStoreSetting(req, res);
  return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
};

export const getAdminSetting = async (req, res) => {
  reqInfo(req);
  try {
    const loggedInUser = req.headers.user as any;
    const setting = await findAdminSettingForUser(loggedInUser?._id);
    if (!setting) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Admin setting"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Admin setting"), setting, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getStoreSetting = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(getStoreSettingSchema, req.query, res);
    if (!value) return;

    const loggedInUser = req.headers.user as any;
    if (!await verifyStoreAccess(loggedInUser, value.storeId)) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));
    }

    const setting = await getFirstMatch(settingModel, { storeId: value.storeId, isDeleted: { $ne: true } }, {}, {});
    if (!setting) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store setting"), {}, {}));

    const responseData = await formatStoreSettingResponse(setting);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Store setting"), responseData, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const upsertStoreSetting = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(upsertStoreSettingSchema, req.body, res);
    if (!value) return;

    const loggedInUser = req.headers.user as any;
    if (!await verifyStoreAccess(loggedInUser, value.storeId)) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));
    }

    const { storeId, ...payload } = value;
    const criteria = { storeId, isDeleted: { $ne: true } };
    const existing = await getFirstMatch(settingModel, criteria, {}, {});

    let result;
    if (existing) {
        result = await updateData(settingModel, { _id: existing._id }, { ...payload, storeId, userId: null }, { runValidators: true });
    } else {
        result = await new settingModel({ ...payload, storeId, userId: null }).save();
    }

    const responseData = await formatStoreSettingResponse(result);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Setting updated", responseData, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const upsertAdminSetting = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(upsertAdminSettingSchema, req.body, res);
    if (!value) return;

    const loggedInUser = req.headers.user as any;
    const existing = await findAdminSettingForUser(loggedInUser?._id);

    const payload = { ...value, userId: loggedInUser?._id, storeId: null };
    let result;
    if (existing && existing.userId) {
        result = await updateData(settingModel, { _id: existing._id }, payload, { runValidators: true });
    } else {
        result = await new settingModel(payload).save();
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Admin setting updated", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

/* --- Helpers --- */

const findAdminSettingForUser = async (userId: string) => {
  const existing = await getFirstMatch(settingModel, { userId, isDeleted: { $ne: true } }, {}, {});
  if (existing) return existing;
  return getFirstMatch(settingModel,{isDeleted: { $ne: true }, userId: null, storeId: null},{},{});
};

const formatStoreSettingResponse = async (setting: any) => {
  const plain = setting?.toObject ? setting.toObject() : setting;
  if (plain.storeId) {
      const store: any = await getFirstMatch(storeModel, { _id: plain.storeId }, { userId: 1 }, {});
      const user: any = await getFirstMatch(userModel, { _id: store?.userId }, { subscription: 1 }, {});
      plain.subscription = user?.subscription || null;
  }
  return plain;
};
