import Joi from "joi";
import { PAYMENT_METHOD } from "../common";
import { objectId } from "./common";

export const upsertStoreSettingSchema = Joi.object({
  storeId: objectId().required(),
  logo: Joi.string().trim().allow(null, "").optional(),
  favicon: Joi.string().trim().allow(null, "").optional(),
  brandName: Joi.string().trim().allow("").optional(),
  themeId: Joi.string().trim().allow("").optional(),
  themeConfig: Joi.object({
    colors: Joi.object().unknown(true).optional(),
    fonts: Joi.object().unknown(true).optional(),
    layout: Joi.object().unknown(true).optional(),
  })
    .unknown(true)
    .optional(),
  metaTitle: Joi.string().trim().allow("").optional(),
  metaDescription: Joi.string().trim().allow("").optional(),
  metaKeywords: Joi.array().items(Joi.string().trim().min(1)).optional(),
  currency: Joi.string().trim().uppercase().optional(),
  timezone: Joi.string().trim().allow("").optional(),
  contactEmail: Joi.string().trim().email().lowercase().allow("").optional(),
  contactPhone: Joi.string().trim().allow("").optional(),
  taxEnabled: Joi.boolean().optional(),
  gstNumber: Joi.string().trim().allow("").optional(),
  shippingEnabled: Joi.boolean().optional(),
  paymentMethods: Joi.array()
    .items(
      Joi.string()
        .trim()
        .lowercase()
        .valid(...Object.values(PAYMENT_METHOD))
    )
    .unique()
    .optional(),
  razorpayApiKey: Joi.string().trim().allow("").optional(),
  razorpayApiSecret: Joi.string().trim().allow("").optional(),
  isRazorpay: Joi.boolean().optional(),
  phonePeApiKey: Joi.string().trim().allow("").optional(),
  phonePeApiSecret: Joi.string().trim().allow("").optional(),
  phonePeVersion: Joi.string().trim().allow("").optional(),
  isPhonePe: Joi.boolean().optional(),
});

export const upsertAdminSettingSchema = Joi.object({
  paymentMethods: Joi.array()
    .items(
      Joi.string()
        .trim()
        .lowercase()
        .valid(...Object.values(PAYMENT_METHOD))
    )
    .min(1)
    .unique()
    .required(),
  razorpayApiKey: Joi.string().trim().allow("").optional(),
  razorpayApiSecret: Joi.string().trim().allow("").optional(),
  isRazorpay: Joi.boolean().optional(),
  phonePeApiKey: Joi.string().trim().allow("").optional(),
  phonePeApiSecret: Joi.string().trim().allow("").optional(),
  phonePeVersion: Joi.string().trim().allow("").optional(),
  isPhonePe: Joi.boolean().optional(),
});

export const getStoreSettingSchema = Joi.object({
  storeId: objectId().required(),
});
