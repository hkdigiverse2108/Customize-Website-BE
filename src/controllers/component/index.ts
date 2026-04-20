import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { componentHistoryModel, componentModel, storeModel } from "../../database";
import { cacheService, checkDuplicateComponent, countData, deleteData, getData, getFirstMatch, handlePostUpdate, reqInfo, responseMessage, updateData, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { componentIdSchema, createComponentSchema, customizeComponentSchema, getAllComponentsQuerySchema, rollbackComponentSchema, updateComponentSchema } from "../../validation";

export const createComponent = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createComponentSchema, req.body, res);
    if (!value) return;

    const user = req.headers.user as any;
    const payload = { ...value, isGlobal: user.role === ACCOUNT_TYPE.ADMIN ? value.isGlobal : false };

    if (user.role === ACCOUNT_TYPE.VENDOR) {
      if (!payload.storeId) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "storeId is required", {}, {}));
      if (!await verifyStoreAccess(user, payload.storeId)) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
    }

    if (await checkDuplicateComponent(payload)) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("component"), {}, {}));

    const created = await new componentModel(payload).save();
    await handlePostUpdate({ user, action: "create", resourceType: "component", resourceId: String(created._id), newData: created, storeId: payload.storeId, isGlobal: payload.isGlobal, req });

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Component"), created, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateComponent = async (req, res) => {
  reqInfo(req);
  try {
    const user = req.headers.user as any;
    const { id, ...body } = req.body;
    const idVal = validate(componentIdSchema, { id }, res);
    const bodyVal = validate(updateComponentSchema, body, res);
    if (!idVal || !bodyVal) return;

    const existing: any = await getFirstMatch(componentModel, { _id: idVal.id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Component"), {}, {}));

    if (existing.isReadOnly && user.role !== ACCOUNT_TYPE.ADMIN) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, "Component is read-only", {}, {}));

    if (await checkDuplicateComponent({ ...existing.toObject(), ...bodyVal, storeId: bodyVal.storeId ?? existing.storeId }, idVal.id)) {
      return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("component"), {}, {}));
    }

    if (bodyVal.version && bodyVal.version !== existing.version) {
      await new componentHistoryModel({ componentId: existing._id, storeId: existing.storeId, version: existing.version, configJSON: existing.configJSON, updatedBy: user._id, changeSummary: bodyVal.changeSummary }).save();
    }

    const updated = await updateData(componentModel, { _id: idVal.id }, bodyVal, {});
    await handlePostUpdate({ user, action: "update", resourceType: "component", resourceId: idVal.id, oldData: existing, newData: updated, storeId: String(existing.storeId || ""), isGlobal: existing.isGlobal || updated?.isGlobal, req });

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Component"), updated, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const customizeComponent = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(customizeComponentSchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, val.storeId)) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));

    const base: any = await getFirstMatch(componentModel, { _id: val.componentId, isDeleted: { $ne: true }, isActive: true, isDeprecated: { $ne: true } }, {}, {});
    if (!base) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Component"), {}, {}));

    const payload = getOverridePayload(val);
    if (!Object.keys(payload).length) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Overrides required", {}, {}));

    const existingOverride: any = await getFirstMatch(componentModel, { storeId: val.storeId, $or: [{ _id: base._id }, { sourceComponentId: base._id }], isDeleted: { $ne: true } }, {}, {});

    if (existingOverride) {
      const updated = await updateData(componentModel, { _id: existingOverride._id }, payload, {});
      await handlePostUpdate({ user, action: "update", resourceType: "component", resourceId: String(existingOverride._id), oldData: existingOverride, newData: updated, storeId: val.storeId, req });
      return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Store component"), updated, {}));
    }

    const created = await new componentModel({ ...getBaseOverridePayload(base), ...payload, storeId: val.storeId, sourceComponentId: base._id, isGlobal: false }).save();
    await handlePostUpdate({ user, action: "customize", resourceType: "component", resourceId: String(created._id), newData: created, storeId: val.storeId, req });

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Store component"), created, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const rollbackComponent = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(rollbackComponentSchema, req.body, res);
    if (!val) return;

    const comp: any = await getFirstMatch(componentModel, { _id: val.id, isDeleted: { $ne: true } }, {}, {});
    const hist: any = await getFirstMatch(componentHistoryModel, { _id: val.historyId, componentId: val.id }, {}, {});
    if (!comp || !hist) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Not found", {}, {}));

    const user = req.headers.user as any;
    if (comp.storeId && !await verifyStoreAccess(user, String(comp.storeId))) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));

    await new componentHistoryModel({ componentId: comp._id, storeId: comp.storeId, version: comp.version, configJSON: comp.configJSON, updatedBy: user._id, changeSummary: `Rollback to ${hist.version}` }).save();

    const rolled = await updateData(componentModel, { _id: comp._id }, { configJSON: hist.configJSON, version: hist.version }, {});
    await handlePostUpdate({ user, action: "rollback", resourceType: "component", resourceId: val.id, oldData: comp, newData: rolled, storeId: String(comp.storeId || ""), isGlobal: comp.isGlobal, req });

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Rolled back", rolled, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteComponent = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(componentIdSchema, req.params, res);
    if (!val) return;

    const existing: any = await getFirstMatch(componentModel, { _id: val.id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Not found", {}, {}));

    const user = req.headers.user as any;
    if (existing.isReadOnly && user.role !== ACCOUNT_TYPE.ADMIN) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, "Read-only", {}, {}));
    if (existing.storeId && !await verifyStoreAccess(user, String(existing.storeId))) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));

    const deleted = await deleteData(componentModel, { _id: val.id }, { isActive: false }, {});
    await handlePostUpdate({ user, action: "delete", resourceType: "component", resourceId: val.id, oldData: existing, storeId: String(existing.storeId || ""), isGlobal: existing.isGlobal, req });

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Component"), deleted, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getComponents = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(getAllComponentsQuerySchema, req.query, res);
    if (!val) return;

    const cacheKey = `components_${JSON.stringify(req.query)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", cached, {}));

    const { criteria, options, page, limit } = resolveSortAndFilter(val, ["name", "label"]);
    applyFilters(criteria, val);

    const user = req.headers.user as any;
    if (user?.role === ACCOUNT_TYPE.VENDOR) {
      const stores = await getVendorStoreIds(user);
      if (!stores.length) return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", { components: [], ...getPaginationState(0, page, limit), total_count: 0 }, {}));
      
      criteria.isActive = true;
      criteria.isDeprecated = { $ne: true };
      const allowed = val.storeId && stores.includes(String(val.storeId)) ? [String(val.storeId)] : stores;
      delete criteria.storeId;
      criteria.$and = [...(criteria.$and || []), { $or: [{ storeId: null }, { storeId: { $in: allowed } }] }];
    }

    const components = await getData(componentModel, criteria, {}, options);
    const total = await countData(componentModel, criteria);
    const result = { components, ...getPaginationState(total, page, limit), total_count: total };
    
    await cacheService.set(cacheKey, result, 300);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getComponentById = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(componentIdSchema, req.params, res);
    if (!val) return;

    const user = req.headers.user as any;
    const comp: any = await getFirstMatch(componentModel, { _id: val.id, isDeleted: { $ne: true } }, {}, {});
    if (!comp) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Not found", {}, {}));

    if (user?.role === ACCOUNT_TYPE.VENDOR) {
      if (!comp.isActive || comp.isDeprecated) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Not found", {}, {}));
      if (comp.storeId && !await verifyStoreAccess(user, String(comp.storeId))) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Not found", {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", comp, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

// Helpers
const applyFilters = (criteria: any, val: any) => {
  if (val.type) criteria.type = val.type;
  if (val.category) criteria.category = val.category;
  if (val.supportedPage) criteria.supportedPages = { $in: [val.supportedPage] };
  if (val.themeId) criteria.supportedThemes = { $in: [val.themeId] };
  if (val.storeId) criteria.storeId = val.storeId;
  const mappings = { reusableFilter: "isReusable", globalFilter: "isGlobal", deprecatedFilter: "isDeprecated" };
  Object.entries(mappings).forEach(([key, field]) => { if (val[key] !== undefined) criteria[field] = val[key]; });
};

const getVendorStoreIds = async (user: any) => {
  const stores = await getData(storeModel, { userId: user._id, isDeleted: { $ne: true } }, { _id: 1 }, {});
  return stores.map((s: any) => String(s._id));
};

const getBaseOverridePayload = (base: any) => ({
  name: base.name, type: base.type, category: base.category, label: base.label, icon: base.icon,
  previewImage: base.previewImage, configJSON: base.configJSON, defaultConfig: base.defaultConfig,
  configSchema: base.configSchema, isReusable: base.isReusable, supportedPages: base.supportedPages,
  supportedThemes: base.supportedThemes, version: base.version, isDeprecated: base.isDeprecated, isActive: base.isActive
});

const getOverridePayload = (val: any) => {
  const fields = ["name", "label", "icon", "previewImage", "configJSON", "defaultConfig", "configSchema", "supportedPages", "supportedThemes", "version", "isReusable", "isDeprecated", "isActive"];
  return fields.reduce((acc: any, f) => { if (val[f] !== undefined) acc[f] = val[f]; return acc; }, {});
};