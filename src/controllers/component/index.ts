import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { componentModel, storeModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { componentIdSchema, createComponentSchema, customizeComponentSchema, getAllComponentsQuerySchema, updateComponentSchema } from "../../validation";


export const createComponent = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = createComponentSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const payload: any = { ...value };

    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) {
      if (!payload?.storeId) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "storeId is required", {}, {}));

      const existingStore = await getFirstMatch(storeModel, getStoreCriteria(loggedInUser, payload.storeId), {}, {});
      if (!existingStore) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));

      payload.isGlobal = false;
      payload.sourceComponentId = payload?.sourceComponentId || null;
    } else {
      if (!payload?.storeId) payload.storeId = null;
    }

    const duplicateCriteria: any = {
      name: payload.name,
      type: payload.type,
      version: payload.version || "1.0.0",
      storeId: payload.storeId || null,
      isDeleted: { $ne: true },
    };
    const duplicateComponent = await getFirstMatch(componentModel, duplicateCriteria, {}, {});
    if (duplicateComponent) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("component"), {}, {}));

    const createdComponent = await new componentModel(payload).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Component"), createdComponent, {}));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("component"), {}, {}));
    }

    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateComponent = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...updatePayload } = req.body;
    const { error: idError, value: idValue } = componentIdSchema.validate({ id });
    if (idError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, idError?.details[0]?.message, {}, {}));

    const { error: bodyError, value: bodyValue } = updateComponentSchema.validate(updatePayload);
    if (bodyError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, bodyError?.details[0]?.message, {}, {}));

    const existingComponent: any = await getFirstMatch(componentModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {});
    if (!existingComponent) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Component"), {}, {}));

    const nextName = bodyValue?.name || existingComponent.name;
    const nextType = bodyValue?.type || existingComponent.type;
    const nextVersion = bodyValue?.version || existingComponent.version;
    const nextStoreId = bodyValue?.storeId !== undefined ? bodyValue.storeId : existingComponent.storeId;

    const duplicateComponent = await getFirstMatch(
      componentModel,
      { _id: { $ne: idValue.id }, name: nextName, type: nextType, version: nextVersion, storeId: nextStoreId || null, isDeleted: { $ne: true } },
      {},
      {}
    );
    if (duplicateComponent) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("component"), {}, {}));

    const updatedComponent = await updateData(componentModel, { _id: idValue.id, isDeleted: { $ne: true } }, bodyValue, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Component"), updatedComponent, {}));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("component"), {}, {}));
    }

    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const customizeComponent = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = customizeComponentSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const existingStore = await getFirstMatch(storeModel, getStoreCriteria(loggedInUser, value.storeId), {}, {});
    if (!existingStore) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));

    const baseComponent: any = await getFirstMatch(componentModel, { _id: value.componentId, isDeleted: { $ne: true } }, {}, {});
    if (!baseComponent) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Component"), {}, {}));

    if (baseComponent?.isActive !== true || baseComponent?.isDeprecated === true) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Component"), {}, {}));
    }

    const overridePayload: any = getOverridePayload(value);
    if (Object.keys(overridePayload).length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "At least one editable override field is required", {}, {}));
    }
    overridePayload.isGlobal = false;

    if (baseComponent?.storeId && String(baseComponent.storeId) !== String(value.storeId)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
    }

    if (baseComponent?.storeId && String(baseComponent.storeId) === String(value.storeId)) {
      const updatedComponent = await updateData(componentModel, { _id: baseComponent._id, isDeleted: { $ne: true } }, overridePayload, {});
      return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Store component"), updatedComponent, {}));
    }

    const existingOverride = await getFirstMatch(
      componentModel,
      { storeId: value.storeId, sourceComponentId: baseComponent._id, isDeleted: { $ne: true } },
      {},
      {}
    );

    if (existingOverride) {
      const updatedOverride = await updateData(componentModel, { _id: existingOverride._id, isDeleted: { $ne: true } }, overridePayload, {});
      return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Store component"), updatedOverride, {}));
    }

    const createdOverride = await new componentModel({
      ...getBaseOverridePayload(baseComponent),
      ...overridePayload,
      storeId: value.storeId,
      sourceComponentId: baseComponent._id,
      isGlobal: false,
    }).save();

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Store component"), createdOverride, {}));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("component"), {}, {}));
    }

    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteComponent = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = componentIdSchema.validate(req.params);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const deletedComponent = await deleteData(componentModel, { _id: value.id, isDeleted: { $ne: true } }, { isActive: false }, {});
    if (!deletedComponent) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Component"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Component"), deletedComponent, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getComponents = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = getAllComponentsQuerySchema.validate(req.query);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["name", "label"]);

    if (value?.type) criteria.type = value.type;
    if (value?.category) criteria.category = value.category;
    if (value?.supportedPage) criteria.supportedPages = { $in: [value.supportedPage] };
    if (value?.themeId) criteria.supportedThemes = { $in: [value.themeId] };
    if (value?.storeId) criteria.storeId = value.storeId;

    if (value?.reusableFilter === true) criteria.isReusable = true;
    else if (value?.reusableFilter === false) criteria.isReusable = false;

    if (value?.globalFilter === true) criteria.isGlobal = true;
    else if (value?.globalFilter === false) criteria.isGlobal = false;

    if (value?.deprecatedFilter === true) criteria.isDeprecated = true;
    else if (value?.deprecatedFilter === false) criteria.isDeprecated = false;

    const loggedInUser = req.headers.user as any;
    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) {
      const vendorStoreIds = await getVendorStoreIds(loggedInUser);
      if (vendorStoreIds.length === 0) {
        return res.status(HTTP_STATUS.OK).json(
          apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Components"), { components: [], page: Number(page), limit: Number(limit) || 0, page_limit: 1, total_count: 0 }, {})
        );
      }

      criteria.isActive = true;
      criteria.isDeprecated = { $ne: true };

      let allowedStoreIds = vendorStoreIds;
      if (value?.storeId) {
        const hasAccess = vendorStoreIds.some((storeId) => String(storeId) === String(value.storeId));
        if (!hasAccess) {
          return res.status(HTTP_STATUS.OK).json(
            apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Components"), { components: [], page: Number(page), limit: Number(limit) || 0, page_limit: 1, total_count: 0 }, {})
          );
        }
        allowedStoreIds = [String(value.storeId)];
      }

      delete criteria.storeId;
      appendOrScope(criteria, [{ storeId: null }, { storeId: { $in: allowedStoreIds } }]);
    }

    const components = await getData(componentModel, criteria, {}, options);
    const totalCount = await countData(componentModel, criteria);
    const pagination = getPaginationState(totalCount, Number(page), Number(limit));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Components"), { components, ...pagination, total_count: totalCount }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getComponentById = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = componentIdSchema.validate(req.params);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const component: any = await getFirstMatch(componentModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!component) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Component"), {}, {}));

    if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) {
      if (component?.isActive !== true || component?.isDeprecated === true) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Component"), {}, {}));
      }

      if (component?.storeId) {
        const hasStoreAccess = await getFirstMatch(storeModel, getStoreCriteria(loggedInUser, String(component.storeId)), {}, {});
        if (!hasStoreAccess) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Component"), {}, {}));
      }
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Component"), component, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

const getStoreCriteria = (loggedInUser: any, storeId: string) => {
  const criteria: any = { _id: storeId, isDeleted: { $ne: true } };
  if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) criteria.userId = loggedInUser?._id;
  return criteria;
};

const getVendorStoreIds = async (loggedInUser: any) => {
  const stores = await getData(storeModel, { userId: loggedInUser?._id, isDeleted: { $ne: true } }, { _id: 1 }, {});
  return stores.map((store: any) => String(store?._id));
};

const appendOrScope = (criteria: any, orScope: any[]) => {
  if (criteria.$or) {
    const existingOr = criteria.$or;
    delete criteria.$or;
    criteria.$and = [...(criteria.$and || []), { $or: existingOr }, { $or: orScope }];
    return;
  }

  criteria.$and = [...(criteria.$and || []), { $or: orScope }];
};

const getBaseOverridePayload = (baseComponent: any) => ({
  name: baseComponent?.name,
  type: baseComponent?.type,
  category: baseComponent?.category || null,
  label: baseComponent?.label || "",
  icon: baseComponent?.icon || "",
  previewImage: baseComponent?.previewImage || "",
  configJSON: baseComponent?.configJSON || {},
  defaultConfig: baseComponent?.defaultConfig || {},
  configSchema: baseComponent?.configSchema || {},
  isReusable: baseComponent?.isReusable ?? true,
  isGlobal: false,
  supportedPages: baseComponent?.supportedPages || [],
  supportedThemes: baseComponent?.supportedThemes || [],
  version: baseComponent?.version || "1.0.0",
  isDeprecated: baseComponent?.isDeprecated ?? false,
  isActive: baseComponent?.isActive ?? true,
});

const editableOverrideFields = [
  "name",
  "label",
  "icon",
  "previewImage",
  "configJSON",
  "defaultConfig",
  "configSchema",
  "supportedPages",
  "supportedThemes",
  "version",
  "isReusable",
  "isDeprecated",
  "isActive",
];

const getOverridePayload = (value: any) => {
  const payload: any = {};
  for (const field of editableOverrideFields) {
    if (value?.[field] !== undefined) payload[field] = value[field];
  }
  return payload;
};