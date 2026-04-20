import { Schema, model, Document, Types } from "mongoose";

export interface IAnalytics extends Document {
  storeId: Types.ObjectId | string;
  eventType: 'visit' | 'view' | 'click' | 'sale';
  resourceType?: 'product' | 'page' | 'component';
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    eventType: { type: String, enum: ['visit', 'view', 'click', 'sale'], required: true },
    resourceType: { type: String, enum: ['product', 'page', 'component'], default: null },
    resourceId: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

analyticsSchema.index({ storeId: 1, eventType: 1, timestamp: -1 });
analyticsSchema.index({ storeId: 1, resourceType: 1, resourceId: 1 });

export const analyticsModel = model<IAnalytics>("analytics", analyticsSchema);
