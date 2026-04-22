import Joi from "joi";
import { objectId } from "../common";
import { PAYMENT_METHOD } from "../../common";

const paymentSettingScopeSchema = Joi.object({
  storeId: objectId().optional(),
  isGlobal: Joi.boolean().default(false),
  razorpayApiKey: Joi.string().trim().allow("").default(""),
  razorpayApiSecret: Joi.string().trim().allow("").default(""),
  isRazorpay: Joi.boolean().default(false),
  phonePeApiKey: Joi.string().trim().allow("").default(""),
  phonePeApiSecret: Joi.string().trim().allow("").default(""),
  phonePeVersion: Joi.string().trim().allow("").default(""),
  isPhonePe: Joi.boolean().default(false),
  paymentMethods: Joi.array().items(Joi.string().valid(...Object.values(PAYMENT_METHOD))).default([]),
}).custom((value, helpers) => {
  if (value.isGlobal) {
    return value.storeId ? helpers.error("any.invalid") : value;
  }

  if (!value.storeId) {
    return helpers.error("any.invalid");
  }

  return value;
}).messages({
  "any.invalid": "storeId is required unless isGlobal is true",
});

export const upsertPaymentSettingSchema = paymentSettingScopeSchema;

export const getPaymentSettingSchema = paymentSettingScopeSchema.fork(["paymentMethods", "razorpayApiKey", "razorpayApiSecret", "isRazorpay", "phonePeApiKey", "phonePeApiSecret", "phonePeVersion", "isPhonePe"], (schema) => schema.optional());
