import Joi from "joi";
import { objectId } from "./common";
import { DISCOUNT_APPLIES_TO, DISCOUNT_TYPE } from "../common";

const discountTypes = Object.values(DISCOUNT_TYPE);
const discountAppliesTo = Object.values(DISCOUNT_APPLIES_TO);

export const createDiscountSchema = Joi.object({
  storeId: objectId().required(),
  title: Joi.string().trim().min(3).max(100).required(),
  code: Joi.string().trim().uppercase().min(3).max(50).required(),
  type: Joi.string().valid(...discountTypes).required(),
  value: Joi.number().min(0).required(),
  minOrderValue: Joi.number().min(0).default(0),
  maxDiscountAmount: Joi.number().min(0).default(0),
  usageLimit: Joi.number().integer().min(1).allow(null).default(null),
  isActive: Joi.boolean().default(true),
  startsAt: Joi.date().default(Date.now),
  endsAt: Joi.date().min(Joi.ref("startsAt")).allow(null).default(null),
  appliesTo: Joi.string().valid(...discountAppliesTo).default(DISCOUNT_APPLIES_TO.ALL),
  productIds: Joi.array().items(objectId()).optional(),
  collectionIds: Joi.array().items(objectId()).optional(),
  customerIds: Joi.array().items(objectId()).optional(),
  prerequisiteProductIds: Joi.array().items(objectId()).optional(),
  prerequisiteQuantity: Joi.number().integer().min(0).optional(),
  entitledQuantity: Joi.number().integer().min(0).optional(),
});

export const updateDiscountSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).optional(),
  code: Joi.string().trim().uppercase().min(3).max(50).optional(),
  type: Joi.string().valid(...discountTypes).optional(),
  value: Joi.number().min(0).optional(),
  minOrderValue: Joi.number().min(0).optional(),
  maxDiscountAmount: Joi.number().min(0).optional(),
  usageLimit: Joi.number().integer().min(1).allow(null).optional(),
  isActive: Joi.boolean().optional(),
  startsAt: Joi.date().optional(),
  endsAt: Joi.date().min(Joi.ref("startsAt")).allow(null).optional(),
  appliesTo: Joi.string().valid(...discountAppliesTo).optional(),
  productIds: Joi.array().items(objectId()).optional(),
  collectionIds: Joi.array().items(objectId()).optional(),
  customerIds: Joi.array().items(objectId()).optional(),
  prerequisiteProductIds: Joi.array().items(objectId()).optional(),
  prerequisiteQuantity: Joi.number().integer().min(0).optional(),
  entitledQuantity: Joi.number().integer().min(0).optional(),
}).min(1);

export const discountIdSchema = Joi.object({
  id: objectId().required(),
});

export const getAllDiscountsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().allow("").optional(),
  storeId: objectId().optional(),
  isActive: Joi.boolean().optional(),
  type: Joi.string().valid(...discountTypes).optional(),
  sortFilter: Joi.string().valid("newest", "oldest", "titleAsc", "titleDesc").optional(),
});
