import { Schema, model } from "mongoose";
import { IPolicy } from "../../type";

const policySchema = new Schema<IPolicy>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store" },
    type: { type: String },
    content: { type: String },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

policySchema.index({ storeId: 1, type: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const policyModel = model<IPolicy>("policy", policySchema);
