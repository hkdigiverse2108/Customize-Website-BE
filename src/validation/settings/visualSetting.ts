import Joi from "joi";
import { objectId } from "../common";

export const upsertVisualSettingSchema = Joi.object({
  storeId: objectId().required(),
  favicon: Joi.string().trim().allow("").optional(),
  customCSS: Joi.string().trim().allow("").optional(),
  customJS: Joi.string().trim().allow("").optional(),
  passwordProtection: Joi.object({
    enabled: Joi.boolean().default(false),
    password: Joi.string().trim().allow("").optional(),
    message: Joi.string().trim().allow("").optional(),
  }).default(),
  checkoutPage: Joi.object({
    banner: Joi.string().trim().allow("").optional(),
    logo: Joi.string().trim().allow("").optional(),
    accentColor: Joi.string().trim().allow("").default("#000000"),
  }).default(),
});

export const getVisualSettingSchema = Joi.object({
  storeId: objectId().required(),
});
