import { Schema, model } from "mongoose";
import { ITaxSetting } from "../../../type/settings/taxSetting";

const taxSettingSchema = new Schema<ITaxSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    taxEnabled: { type: Boolean, default: false },
    taxName: { type: String, trim: true, default: "GST" },
    taxPercentage: { type: Number, default: 0 },
    isTaxIncluded: { type: Boolean, default: false },
    gstNumber: { type: String, trim: true, default: "" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

taxSettingSchema.index({ storeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const taxSettingModel = model<ITaxSetting>("taxSetting", taxSettingSchema);
