import { Schema, model } from "mongoose";
import { IThemeSetting } from "../../../type/settings/themeSetting";

const themeSettingSchema = new Schema<IThemeSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    themeId: { type: Schema.Types.ObjectId, ref: "theme", required: true },
    themeConfig: { type: Schema.Types.Mixed, default: {} },
    isPublished: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

themeSettingSchema.index({ storeId: 1, themeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const themeSettingModel = model<IThemeSetting>("themeSetting", themeSettingSchema);
