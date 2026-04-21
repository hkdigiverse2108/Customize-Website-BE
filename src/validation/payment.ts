import Joi from "joi";
import { objectId } from "./common";

const validatePurchaseReference = (value, helpers) => {
  const hasPlanId = !!value?.planId;
  const hasThemeId = !!value?.themeId;
  const hasOrderId = !!value?.orderId;
  const referenceCount = [hasPlanId, hasThemeId, hasOrderId].filter(Boolean).length;
  if (referenceCount !== 1) return helpers.error("any.invalid");
  return value;
};

export const createPhonePePaymentSchema = Joi.object({
  planId: objectId().optional(),
  themeId: objectId().optional(),
  orderId: objectId().optional(),
  redirectUrl: Joi.string().trim().uri().required(),
  currency: Joi.string().trim().uppercase().optional(),
})
  .custom(validatePurchaseReference)
  .messages({"any.invalid": "Exactly one of planId, themeId or orderId is required",});

export const createRazorpayPaymentSchema = Joi.object({
  planId: objectId().optional(),
  themeId: objectId().optional(),
  orderId: objectId().optional(),
  currency: Joi.string().trim().uppercase().optional(),
  receipt: Joi.string().trim().max(80).optional(),
})
  .custom(validatePurchaseReference)
  .messages({"any.invalid": "Exactly one of planId, themeId or orderId is required",});

export const razorpayPaymentVerifySchema = Joi.object({
  razorpay_order_id: Joi.string().trim().optional(),
  razorpayOrderId: Joi.string().trim().optional(),
  razorpay_payment_id: Joi.string().trim().optional(),
  razorpayPaymentId: Joi.string().trim().optional(),
  razorpay_signature: Joi.string().trim().optional(),
  razorpaySignature: Joi.string().trim().optional(),
  transactionId: Joi.string().trim().optional(),
  orderId: objectId().optional(),
})
  .custom((value, helpers) => {
    const orderId = value.razorpay_order_id || value.razorpayOrderId;
    const paymentId = value.razorpay_payment_id || value.razorpayPaymentId;
    const signature = value.razorpay_signature || value.razorpaySignature;
    if (!orderId || !paymentId || !signature) return helpers.error("any.invalid");
    return value;
  })
  .messages({"any.invalid": "razorpay_order_id, razorpay_payment_id and razorpay_signature are required",});
