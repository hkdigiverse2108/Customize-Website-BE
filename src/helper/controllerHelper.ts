import { HTTP_STATUS, ACCOUNT_TYPE } from "../common";
import { apiResponse, IAuthenticatedUser } from "../type";
import { componentModel, storeModel } from "../database";
import { getFirstMatch, logAudit, cacheService } from "../helper";

export const validate = (schema: any, data: any, res: any) => {
  const { error, value } = schema.validate(data);
  if (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error.details[0].message, {}, {}));
    return null;
  }
  return value;
};

export const verifyStoreAccess = async (user: IAuthenticatedUser, storeId: string) => {
  if (user.role === ACCOUNT_TYPE.ADMIN) return true;
  const store = await getFirstMatch(storeModel, { _id: storeId, userId: user._id, isDeleted: { $ne: true } }, {}, {});
  return !!store;
};

export const checkDuplicateComponent = async (payload: any, excludeId?: string) => {
  const criteria: any = {
    name: payload.name,
    type: payload.type,
    version: payload.version || "1.0.0",
    storeId: payload.storeId || null,
    isDeleted: { $ne: true },
  };
  if (excludeId) criteria._id = { $ne: excludeId };
  
  return await getFirstMatch(componentModel, criteria, {}, {});
};

export const handlePostUpdate = async (params: {
  user: any;
  action: 'create' | 'update' | 'delete' | 'customize' | 'rollback';
  resourceType: string;
  resourceId: string;
  oldData?: any;
  newData?: any;
  storeId?: string;
  isGlobal?: boolean;
  req: any;
}) => {
  const { user, action, resourceType, resourceId, oldData, newData, storeId, isGlobal, req } = params;

  await logAudit({
    userId: user._id,
    storeId: storeId || "",
    action,
    resourceType,
    resourceId,
    oldData,
    newData,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  if (isGlobal) await cacheService.del("global_components");
  if (storeId) await cacheService.clearStore(storeId);
};

export const checkFieldDuplicate = async (model: any, field: string, value: any, excludeId?: string, additionalCriteria: any = {}) => {
  if (value === undefined || value === null || value === "") return null;
  const criteria: any = { [field]: value, isDeleted: { $ne: true }, ...additionalCriteria };
  if (excludeId) criteria._id = { $ne: excludeId };
  return await getFirstMatch(model, criteria, {}, {});
};
