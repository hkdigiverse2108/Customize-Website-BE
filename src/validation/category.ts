import Joi from "joi";
import { objectId } from "./common";

export const createCategorySchema = Joi.object({
  storeId: Joi.string().required(),
  name: Joi.string().required(),
  slug: Joi.string().required(),
  description: Joi.string().allow(""),
  image: Joi.string().allow(""),
  parentCategoryId: Joi.string().allow(null),
  isActive: Joi.boolean().default(true),
});

export const updateCategorySchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string(),
  slug: Joi.string(),
  description: Joi.string().allow(""),
  image: Joi.string().allow(""),
  parentCategoryId: Joi.string().allow(null),
  isActive: Joi.boolean(),
});

export const getAllCategoriesQuerySchema = Joi.object({
  storeId: Joi.string(),
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
  activeFilter: Joi.boolean().optional(),
  search: Joi.string().allow(""),
  sort: Joi.string(),
  order: Joi.string().valid("asc", "desc"),
});

export const categoryIdSchema = Joi.object({
  id: objectId().required(),
});
