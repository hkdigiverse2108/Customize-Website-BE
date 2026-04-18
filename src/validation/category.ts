import Joi from "joi";
import { objectId } from "./common";

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().allow("").optional(),
  isActive: Joi.boolean().optional(),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).optional(),
  description: Joi.string().trim().allow("").optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

export const categoryIdSchema = Joi.object({
  id: objectId().required(),
});

export const getAllCategoriesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().allow("").optional(),
  activeFilter: Joi.boolean().optional(),
  sortFilter: Joi.string().valid("nameAsc", "nameDesc", "newest", "oldest").optional(),
  startDateFilter: Joi.date().optional(),
  endDateFilter: Joi.date().optional(),
});
