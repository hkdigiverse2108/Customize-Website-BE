import { Schema, model } from "mongoose";
import { IThemeSetting } from "../../../type/settings/themeSetting";
import { themeSettingItemSchema, themePageLayoutSchema } from "../theme";




const themeSettingSchema = new Schema<IThemeSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    themeId: { type: Schema.Types.ObjectId, ref: "theme", required: true },
    customLayoutJSON: { type: [themePageLayoutSchema], default: [] },
    draftLayoutJSON: { type: [themePageLayoutSchema], default: [] },
    customStyles: { type: [themeSettingItemSchema], default: [] },
    customSettings: { type: [themeSettingItemSchema], default: [] },


    baseVersion: { type: String, default: "1.0.0" },
    isPublished: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

themeSettingSchema.index({ storeId: 1, themeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const themeSettingModel = model<IThemeSetting>("themeSetting", themeSettingSchema);
