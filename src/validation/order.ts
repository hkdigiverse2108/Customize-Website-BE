import Joi from "joi";
import { objectId } from "./common";
import {ORDER_STATUS,FINANCIAL_STATUS,FULFILLMENT_STATUS,ORDER_CURRENCY,PAYMENT_METHOD,PAYMENT_STATUS,SHIPMENT_STATUS} from "../common/enum";

const orderStatuses = Object.values(ORDER_STATUS);
const financialStatuses = Object.values(FINANCIAL_STATUS);
const fulfillmentStatuses = Object.values(FULFILLMENT_STATUS);
const orderCurrencies = Object.values(ORDER_CURRENCY);
const paymentMethods = Object.values(PAYMENT_METHOD);
const paymentStatuses = Object.values(PAYMENT_STATUS);
const shipmentStatuses = Object.values(SHIPMENT_STATUS);

const lineItemSchema = Joi.object({
  productId: objectId().required().invalid(null),
  variantId: objectId().optional(),
  title: Joi.string().trim().min(1).max(200).required(),
  quantity: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required(),
  total: Joi.number().min(0).optional(),
});

const addressSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(120).required(),
  lastName: Joi.string().trim().allow("").max(120).optional(),
  address1: Joi.string().trim().min(1).max(300).required(),
  address2: Joi.string().trim().allow("").max(300).optional(),
  city: Joi.string().trim().min(1).max(120).required(),
  state: Joi.string().trim().min(1).max(120).required(),
  country: Joi.string().trim().min(1).max(120).required(),
  pincode: Joi.string().trim().min(1).max(20).required(),
  phone: Joi.string().trim().min(6).max(20).required(),
});

const paymentDetailsSchema = Joi.object({
  method: Joi.string().trim().lowercase().valid(...paymentMethods).empty("").optional(),
  transactionId: Joi.string().trim().allow("").max(180).optional(),
  status: Joi.string().trim().lowercase().valid(...paymentStatuses).empty("").optional(),
  paidAt: Joi.date().allow(null).optional(),
});

const fulfillmentSchema = Joi.object({
  trackingNumber: Joi.string().trim().allow("").max(100).optional(),
  carrier: Joi.string().trim().allow("").max(100).optional(),
  status: Joi.string().trim().lowercase().valid(...shipmentStatuses).empty("").optional(),
  shippedAt: Joi.date().allow(null).optional(),
  deliveredAt: Joi.date().allow(null).optional(),
});

const withOrderStateConsistency = (value, helpers) => {
  if (value?.isCancelled === true && value?.status && value.status !== "cancelled") {
    return helpers.error("any.custom", { message: "status must be cancelled when isCancelled is true" });
  }

  if (value?.fulfillmentStatus === "delivered" && value?.isDelivered === false) {
    return helpers.error("any.custom", { message: "isDelivered cannot be false when fulfillmentStatus is delivered" });
  }

  return value;
};

export const createOrderSchema = Joi.object({
  storeId: objectId().required().invalid(null),
  sourceDomain: Joi.string().trim().lowercase().allow("", null).optional(),
  websiteId: objectId().optional().allow(null),
  customerId: objectId().optional().allow(null),
  orderNumber: Joi.number().integer().min(1).optional(),
  orderName: Joi.string().trim().allow("").max(80).optional(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string().trim().min(6).max(20).required(),
  status: Joi.string().trim().lowercase().valid(...orderStatuses).empty("").optional(),
  financialStatus: Joi.string().trim().lowercase().valid(...financialStatuses).empty("").optional(),
  fulfillmentStatus: Joi.string().trim().lowercase().valid(...fulfillmentStatuses).empty("").optional(),
  currency: Joi.string().trim().uppercase().valid(...orderCurrencies).empty("").optional(),
  subtotalPrice: Joi.number().min(0).optional(),
  totalTax: Joi.number().min(0).optional(),
  shippingPrice: Joi.number().min(0).optional(),
  discountTotal: Joi.number().min(0).optional(),
  totalPrice: Joi.number().min(0).optional(),
  lineItems: Joi.array().items(lineItemSchema).min(1).required(),
  shippingAddress: addressSchema.required(),
  billingAddress: addressSchema.optional(),
  paymentDetails: paymentDetailsSchema.optional(),
  fulfillments: Joi.array().items(fulfillmentSchema).optional(),
  notes: Joi.string().trim().allow("").optional(),
  tags: Joi.array().items(Joi.string().trim().min(1).max(80)).optional(),
  isPaid: Joi.boolean().optional(),
  isDelivered: Joi.boolean().optional(),
  isCancelled: Joi.boolean().optional(),
  cancelReason: Joi.string().trim().allow("", null).optional(),
  cancelledAt: Joi.date().allow(null).optional(),
  isActive: Joi.boolean().optional(),
})
  .custom(withOrderStateConsistency)
  .messages({
    "any.custom": "{{#message}}",
  });

export const updateOrderSchema = Joi.object({
  orderNumber: Joi.number().integer().min(1).optional(),
  orderName: Joi.string().trim().allow("").max(80).optional(),
  email: Joi.string().trim().email().optional(),
  phone: Joi.string().trim().min(6).max(20).optional(),
  websiteId: objectId().optional().allow(null),
  status: Joi.string().trim().lowercase().valid(...orderStatuses).empty("").optional(),
  financialStatus: Joi.string().trim().lowercase().valid(...financialStatuses).empty("").optional(),
  fulfillmentStatus: Joi.string().trim().lowercase().valid(...fulfillmentStatuses).empty("").optional(),
  currency: Joi.string().trim().uppercase().valid(...orderCurrencies).empty("").optional(),
  subtotalPrice: Joi.number().min(0).optional(),
  totalTax: Joi.number().min(0).optional(),
  shippingPrice: Joi.number().min(0).optional(),
  discountTotal: Joi.number().min(0).optional(),
  totalPrice: Joi.number().min(0).optional(),
  lineItems: Joi.array().items(lineItemSchema).min(1).optional(),
  shippingAddress: addressSchema.optional(),
  billingAddress: addressSchema.optional(),
  paymentDetails: paymentDetailsSchema.optional(),
  fulfillments: Joi.array().items(fulfillmentSchema).optional(),
  notes: Joi.string().trim().allow("").optional(),
  tags: Joi.array().items(Joi.string().trim().min(1).max(80)).optional(),
  isPaid: Joi.boolean().optional(),
  isDelivered: Joi.boolean().optional(),
  isCancelled: Joi.boolean().optional(),
  cancelReason: Joi.string().trim().allow("", null).optional(),
  cancelledAt: Joi.date().allow(null).optional(),
  isActive: Joi.boolean().optional(),
})
  .min(1)
  .custom(withOrderStateConsistency)
  .messages({
    "any.custom": "{{#message}}",
  });

export const orderIdSchema = Joi.object({
  id: objectId().required().invalid(null),
});

export const getAllOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().allow("").optional(),
  activeFilter: Joi.boolean().optional(),
  sortFilter: Joi.string().valid("nameAsc", "nameDesc", "newest", "oldest", "totalAsc", "totalDesc", "orderNumberAsc", "orderNumberDesc").optional(),
  startDateFilter: Joi.date().optional(),
  endDateFilter: Joi.date().optional(),
  storeId: objectId().optional(),
  customerId: objectId().optional(),
  orderNumber: Joi.number().integer().min(1).optional(),
  sourceDomain: Joi.string().trim().lowercase().allow("", null).optional(),
  websiteId: objectId().optional(),
  statusFilter: Joi.string().trim().lowercase().valid(...orderStatuses).optional(),
  financialStatusFilter: Joi.string().trim().lowercase().valid(...financialStatuses).optional(),
  fulfillmentStatusFilter: Joi.string().trim().lowercase().valid(...fulfillmentStatuses).optional(),
  isPaidFilter: Joi.boolean().optional(),
  isDeliveredFilter: Joi.boolean().optional(),
  isCancelledFilter: Joi.boolean().optional(),
  currency: Joi.string().trim().uppercase().valid(...orderCurrencies).optional(),
});
