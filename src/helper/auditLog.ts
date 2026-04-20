import { auditLogModel } from "../database";

export const logAudit = async (payload: {
  userId: string;
  storeId?: string;
  action: 'create' | 'update' | 'delete' | 'customize' | 'rollback';
  resourceType: string;
  resourceId: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}) => {
  try {
    await new auditLogModel(payload).save();
  } catch (error) {
    console.error("Audit log failed:", error);
    // We don't want audit log failure to break the main process
  }
};
