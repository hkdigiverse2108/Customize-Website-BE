import { Schema, model } from "mongoose";
import { ISEOSetting } from "../../../type/settings/seoSetting";
import { themeSettingItemSchema } from "../theme";


const seoSettingSchema = new Schema<ISEOSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    settings: { type: [themeSettingItemSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },

  { timestamps: true, versionKey: false }
);

seoSettingSchema.index({ storeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const seoSettingModel = model<ISEOSetting>("seoSetting", seoSettingSchema);
