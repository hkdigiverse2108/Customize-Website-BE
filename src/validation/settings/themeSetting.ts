import Joi from "joi";
import { objectId, settingItemSchema } from "../common";
import { themeLayoutSchema } from "../theme";









export const upsertThemeSettingSchema = Joi.object({
  storeId: objectId().required(),
  themeId: objectId().required(),
  customLayoutJSON: themeLayoutSchema,
  draftLayoutJSON: themeLayoutSchema,

  customStyles: Joi.array().items(settingItemSchema).optional(),
  customSettings: Joi.array().items(settingItemSchema).optional(),


  baseVersion: Joi.string().trim().optional(),
});

export const publishThemeSchema = Joi.object({
  storeId: objectId().required(),
  themeId: objectId().required(),
});

export const getThemeSettingSchema = Joi.object({
  storeId: objectId().required(),
  themeId: objectId().optional(), // Optional: if provided, gets that specific theme config, else gets published theme
});
