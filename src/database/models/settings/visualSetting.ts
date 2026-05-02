import { Schema, model } from "mongoose";
import { IVisualSetting } from "../../../type/settings/visualSetting";
import { themeSettingItemSchema } from "../theme";


const visualSettingSchema = new Schema<IVisualSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    settings: { type: [themeSettingItemSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },

  { timestamps: true, versionKey: false }
);

visualSettingSchema.index({ storeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const visualSettingModel = model<IVisualSetting>("visualSetting", visualSettingSchema);
