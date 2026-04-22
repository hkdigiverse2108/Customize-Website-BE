import Joi from "joi";
import { objectId } from "../common";

export const upsertStoreSettingSchema = Joi.object({
  storeId: objectId().required(),
  name: Joi.string().trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  phone: Joi.string().trim().required(),
  logo: Joi.string().trim().allow("").default(""),
  favicon: Joi.string().trim().allow("").default(""),
  address: Joi.object({
    line1: Joi.string().trim().allow("").default(""),
    line2: Joi.string().trim().allow("").default(""),
    city: Joi.string().trim().allow("").default(""),
    state: Joi.string().trim().allow("").default(""),
    zipCode: Joi.string().trim().allow("").default(""),
    country: Joi.string().trim().allow("").default(""),
  }).default({}),
  socialLinks: Joi.object({
    facebook: Joi.string().trim().allow("").default(""),
    instagram: Joi.string().trim().allow("").default(""),
    twitter: Joi.string().trim().allow("").default(""),
    linkedin: Joi.string().trim().allow("").default(""),
    youtube: Joi.string().trim().allow("").default(""),
  }).default({}),
});

export const getStoreSettingSchema = Joi.object({
  storeId: objectId().required(),
});
