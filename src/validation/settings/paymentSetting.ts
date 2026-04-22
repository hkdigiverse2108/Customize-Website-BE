import Joi from "joi";
import { objectId } from "../common";
import { PAYMENT_METHOD } from "../../common";

export const upsertPaymentSettingSchema = Joi.object({
  storeId: objectId().required(),
  razorpayApiKey: Joi.string().trim().allow("").default(""),
  razorpayApiSecret: Joi.string().trim().allow("").default(""),
  isRazorpay: Joi.boolean().default(false),
  phonePeApiKey: Joi.string().trim().allow("").default(""),
  phonePeApiSecret: Joi.string().trim().allow("").default(""),
  phonePeVersion: Joi.string().trim().allow("").default(""),
  isPhonePe: Joi.boolean().default(false),
  paymentMethods: Joi.array().items(Joi.string().valid(...Object.values(PAYMENT_METHOD))).default([]),
});

export const getPaymentSettingSchema = Joi.object({
  storeId: objectId().required(),
});
