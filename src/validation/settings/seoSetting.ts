import Joi from "joi";
import { objectId } from "../common";

export const upsertSEOSettingSchema = Joi.object({
  storeId: objectId().required(),
  metaTitle: Joi.string().trim().allow("").default(""),
  metaDescription: Joi.string().trim().allow("").default(""),
  metaKeywords: Joi.array().items(Joi.string()).default([]),
  googleAnalyticsId: Joi.string().trim().allow("").default(""),
  facebookPixelId: Joi.string().trim().allow("").default(""),
});

export const getSEOSettingSchema = Joi.object({
  storeId: objectId().required(),
});
