import Joi from "joi";
import { ACCOUNT_TYPE } from "../common";
import { objectId } from "./common";

export const updateUserByAdminSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).optional(),
  lastName: Joi.string().trim().min(2).max(100).optional(),
  email: Joi.string().trim().email().lowercase().optional(),
  role: Joi.string().valid(...Object.values(ACCOUNT_TYPE)).optional(),
  trialUsed: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

export const userIdSchema = Joi.object({
  id: objectId().required(),
});

export const getAllUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().allow("").optional(),
  activeFilter: Joi.boolean().optional(),
  sortFilter: Joi.string().valid("nameAsc", "nameDesc", "newest", "oldest").optional(),
  startDateFilter: Joi.date().optional(),
  endDateFilter: Joi.date().optional(),
});
