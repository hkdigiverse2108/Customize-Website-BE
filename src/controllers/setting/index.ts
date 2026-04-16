import { ACCOUNT_TYPE, HTTP_STATUS } from "../../common";
import { settingModel, storeModel, userModel } from "../../database";
import { getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { getStoreSettingSchema, upsertAdminSettingSchema, upsertStoreSettingSchema } from "../../validation";

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

export const getSetting = async (req, res) => {
  const loggedInUser = req.headers.user as any;
  if (loggedInUser?.role === ACCOUNT_TYPE.ADMIN) return getAdminSetting(req, res);
  if (loggedInUser?.role === ACCOUNT_TYPE.STORE_OWNER) return getStoreSetting(req, res);
  return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
};

export const upsertStoreSetting = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = upsertStoreSettingSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const existingStore = await getFirstMatch(storeModel, getStoreCriteria(loggedInUser, value.storeId), {}, {});
    if (!existingStore) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));

    const { storeId, ...payloadWithoutStoreId } = value;
    const normalizedPayload = normalizeSettingPayload(payloadWithoutStoreId);
    const settingPayload = { ...normalizedPayload,userId: null,storeId,};

    const existingSetting = await getFirstMatch(settingModel, { storeId, isDeleted: { $ne: true } }, {}, {});

    if (existingSetting) {
      const updatedSetting = await updateData(settingModel, { _id: existingSetting._id, isDeleted: { $ne: true } }, settingPayload, { runValidators: true });
      const responseData = await formatStoreSettingResponse(updatedSetting, existingStore);
      return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Store setting"), responseData, {}));
    }

    const createdSetting = await new settingModel(settingPayload).save();
    const responseData = await formatStoreSettingResponse(createdSetting, existingStore);
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Store setting"), responseData, {}));
  } catch (error) {
    if (handleDuplicateKeyError(error, res)) return;
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const upsertAdminSetting = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = upsertAdminSettingSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const normalizedPayload = normalizeSettingPayload(value);
    const settingPayload = {...normalizedPayload,userId: loggedInUser?._id,storeId: null,};

    const existingAdminSetting = await findAdminSettingForUser(loggedInUser?._id);

    if (existingAdminSetting) {
      const updatedSetting = await updateData(settingModel, { _id: existingAdminSetting._id, isDeleted: { $ne: true } }, settingPayload, { runValidators: true });
      return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Admin setting"), updatedSetting, {}));
    }

    const createdSetting = await new settingModel(settingPayload).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Admin setting"), createdSetting, {}));
  } catch (error) {
    if (handleDuplicateKeyError(error, res)) return;
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const upsertSetting = async (req, res) => {
  const loggedInUser = req.headers.user as any;
  if (loggedInUser?.role === ACCOUNT_TYPE.ADMIN) return upsertAdminSetting(req, res);
  if (loggedInUser?.role === ACCOUNT_TYPE.STORE_OWNER) return upsertStoreSetting(req, res);
  return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
};

const normalizeSettingPayload = (payload: any = {}) => {
  const normalizedPayload: any = { ...payload };

  if (normalizedPayload.razorpayApiKey === undefined && normalizedPayload.razorpayKey !== undefined) {
    normalizedPayload.razorpayApiKey = normalizedPayload.razorpayKey;
  }

  delete normalizedPayload.razorpayKey;
  return normalizedPayload;
};

const handleDuplicateKeyError = (error: any, res) => {
  if (error?.code !== 11000) return false;
  const duplicateField = Object.keys(error?.keyPattern || {})[0] || "field";
  res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist(duplicateField), {}, {}));
  return true;
};

const getStoreCriteria = (loggedInUser: any, storeId: string) => {
  const criteria: any = { _id: storeId, isDeleted: { $ne: true } };
  if (loggedInUser?.role === ACCOUNT_TYPE.STORE_OWNER) criteria.userId = loggedInUser?._id;
  return criteria;
};

const getStoreSubscription = async (storeUserId: any) => {
  const storeUser: any = await getFirstMatch(userModel, { _id: storeUserId, isDeleted: { $ne: true } }, { subscription: 1 }, {});
  const subscription = storeUser?.subscription || null;
  return subscription;
};

const formatStoreSettingResponse = async (setting: any, store: any) => {
  const plainSetting = setting?.toObject ? setting.toObject() : setting;
  const subscription = await getStoreSubscription(store?.userId);
  return { ...plainSetting, subscription };
};

const findAdminSettingForUser = async (userId: string) => {
  const existingAdminSetting = await getFirstMatch(settingModel, { userId, isDeleted: { $ne: true } }, {}, {});
  if (existingAdminSetting) return existingAdminSetting;

  return getFirstMatch(settingModel,{isDeleted: { $ne: true },$and: [{ $or: [{ userId: null }, { userId: { $exists: false } }] },{ $or: [{ storeId: null }, { storeId: { $exists: false } }] },],},{},{});
};

export const getStoreSetting = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = getStoreSettingSchema.validate(req.query);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const existingStore = await getFirstMatch(storeModel, getStoreCriteria(loggedInUser, value.storeId), {}, {});
    if (!existingStore) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));

    const setting = await getFirstMatch(settingModel, { storeId: value.storeId, isDeleted: { $ne: true } }, {}, {});
    if (!setting) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store setting"), {}, {}));

    const responseData = await formatStoreSettingResponse(setting, existingStore);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Store setting"), responseData, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
