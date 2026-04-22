import Joi from "joi";
import { PLAN_DURATION, SUBSCRIPTION_TYPE } from "../common";
import { objectId } from "./common";

export const createPlanSchema = Joi.object({
  name: Joi.string().trim().lowercase().valid(...Object.values(SUBSCRIPTION_TYPE)).required(),
  price: Joi.number().min(0).required(),
  duration: Joi.string().trim().lowercase().valid(...Object.values(PLAN_DURATION)).required(),
  themeLimit: Joi.number().integer().min(1).default(1),
  storeLimit: Joi.number().integer().min(1).default(1),
  productLimit: Joi.number().integer().min(-1).default(10), // -1 = unlimited
  blogLimit: Joi.number().integer().min(-1).default(5),
  orderLimit: Joi.number().integer().min(-1).default(50),
  customDomainSupport: Joi.boolean().default(false),
  features: Joi.array().items(Joi.string().trim().min(1)).optional().default([]),
  isActive: Joi.boolean().optional(),
});

export const updatePlanSchema = Joi.object({
  name: Joi.string().trim().lowercase().valid(...Object.values(SUBSCRIPTION_TYPE)).optional(),
  price: Joi.number().min(0).optional(),
  duration: Joi.string().trim().lowercase().valid(...Object.values(PLAN_DURATION)).optional(),
  themeLimit: Joi.number().integer().min(1).optional(),
  storeLimit: Joi.number().integer().min(1).optional(),
  productLimit: Joi.number().integer().min(-1).optional(),
  blogLimit: Joi.number().integer().min(-1).optional(),
  orderLimit: Joi.number().integer().min(-1).optional(),
  customDomainSupport: Joi.boolean().optional(),
  features: Joi.array().items(Joi.string().trim().min(1)).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

export const planIdSchema = Joi.object({
  id: objectId().required(),
});
