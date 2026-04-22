import { Schema, model } from "mongoose";
import { ISEOSetting } from "../../../type/settings/seoSetting";

const seoSettingSchema = new Schema<ISEOSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    metaTitle: { type: String, trim: true, default: "" },
    metaDescription: { type: String, trim: true, default: "" },
    metaKeywords: { type: [String], default: [] },
    googleAnalyticsId: { type: String, trim: true, default: "" },
    facebookPixelId: { type: String, trim: true, default: "" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

seoSettingSchema.index({ storeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const seoSettingModel = model<ISEOSetting>("seoSetting", seoSettingSchema);
