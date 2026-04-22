import Joi from "joi";
import { objectId } from "../common";

export const upsertThemeSettingSchema = Joi.object({
  storeId: objectId().required(),
  themeId: objectId().required(),
  themeConfig: Joi.object().optional().default({}),
});

export const publishThemeSchema = Joi.object({
  storeId: objectId().required(),
  themeId: objectId().required(),
});

export const getThemeSettingSchema = Joi.object({
  storeId: objectId().required(),
  themeId: objectId().optional(), // Optional: if provided, gets that specific theme config, else gets published theme
});
