import { Schema, model, Types } from "mongoose";

export interface IAuditLog {
  userId: Types.ObjectId | string;
  storeId?: Types.ObjectId | string;
  action: string; // 'create', 'update', 'delete', 'customize'
  resourceType: string; // 'component', 'product', 'discount', etc.
  resourceId: Types.ObjectId | string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "user", required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: "store", default: null, index: true },
    action: { type: String, required: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: Schema.Types.ObjectId, required: true, index: true },
    oldData: { type: Schema.Types.Mixed, default: null },
    newData: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

auditLogSchema.index({ createdAt: -1 });

export const auditLogModel = model<IAuditLog>("auditLog", auditLogSchema);
