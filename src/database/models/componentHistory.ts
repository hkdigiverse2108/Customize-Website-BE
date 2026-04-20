import { Schema, model, Types } from "mongoose";

export interface IComponentHistory {
  componentId: Types.ObjectId | string;
  storeId?: Types.ObjectId | string;
  version: string;
  configJSON: any;
  updatedBy: Types.ObjectId | string;
  changeSummary?: string;
  createdAt: Date;
}

const componentHistorySchema = new Schema<IComponentHistory>(
  {
    componentId: { type: Schema.Types.ObjectId, ref: "component", required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: "store", default: null, index: true },
    version: { type: String, required: true },
    configJSON: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "user", required: true },
    changeSummary: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

componentHistorySchema.index({ componentId: 1, createdAt: -1 });

export const componentHistoryModel = model<IComponentHistory>("componentHistory", componentHistorySchema);
