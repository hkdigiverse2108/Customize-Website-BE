import { Schema, model } from "mongoose";
import { IRegionSetting } from "../../../type/settings/regionSetting";

const regionSettingSchema = new Schema<IRegionSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    currency: { type: String, default: "INR", trim: true },
    currencySymbol: { type: String, default: "₹", trim: true },
    timezone: { type: String, default: "Asia/Kolkata", trim: true },
    unitSystem: { type: String, enum: ["metric", "imperial"], default: "metric" },
    weightUnit: { type: String, default: "kg", trim: true },
    lengthUnit: { type: String, default: "cm", trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

regionSettingSchema.index({ storeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const regionSettingModel = model<IRegionSetting>("regionSetting", regionSettingSchema);
