import { Schema, model } from "mongoose";
import { IVisualSetting } from "../../../type/settings/visualSetting";

const visualSettingSchema = new Schema<IVisualSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    favicon: { type: String, trim: true },
    customCSS: { type: String, trim: true },
    customJS: { type: String, trim: true },
    passwordProtection: {
      enabled: { type: Boolean, default: false },
      password: { type: String, trim: true },
      message: { type: String, trim: true },
    },
    checkoutPage: {
      banner: { type: String, trim: true },
      logo: { type: String, trim: true },
      accentColor: { type: String, trim: true, default: "#000000" },
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

visualSettingSchema.index({ storeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const visualSettingModel = model<IVisualSetting>("visualSetting", visualSettingSchema);
