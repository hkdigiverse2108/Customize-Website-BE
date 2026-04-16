import Joi from "joi";
import { PLAN_DURATION, SUBSCRIPTION_TYPE } from "../common";
import { objectId } from "./common";

export const createPlanSchema = Joi.object({
  name: Joi.string()
    .trim()
    .lowercase()
    .valid(...Object.values(SUBSCRIPTION_TYPE))
    .required(),
  price: Joi.number().min(0).required(),
  duration: Joi.string()
    .trim()
    .lowercase()
    .valid(...Object.values(PLAN_DURATION))
    .required(),
  features: Joi.array().items(Joi.string().trim().min(1)).min(1).required(),
  isActive: Joi.boolean().optional(),
});

export const updatePlanSchema = Joi.object({
  name: Joi.string()
    .trim()
    .lowercase()
    .valid(...Object.values(SUBSCRIPTION_TYPE))
    .optional(),
  price: Joi.number().min(0).optional(),
  duration: Joi.string()
    .trim()
    .lowercase()
    .valid(...Object.values(PLAN_DURATION))
    .optional(),
  features: Joi.array().items(Joi.string().trim().min(1)).min(1).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

export const planIdSchema = Joi.object({
  id: objectId().required(),
});
