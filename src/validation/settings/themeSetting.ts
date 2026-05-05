import Joi from "joi";
import { objectId, schemaItemSchema, settingItemSchema } from "../common";

export const upsertThemeSettingSchema = Joi.object({
  storeId: objectId().required(),
  themeId: objectId().required(),
  customLayoutJSON: Joi.array().items(schemaItemSchema).optional(),
  draftLayoutJSON: Joi.array().items(schemaItemSchema).optional(),

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
