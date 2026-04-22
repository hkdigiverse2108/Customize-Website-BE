import Joi from "joi";
import { ACCOUNT_TYPE } from "../common";
import { objectId } from "./common";

export const addCustomerSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  email: Joi.string().trim().email().lowercase().required(),
  phone: Joi.string().trim().allow("").optional(),
  storeId: objectId().required(),
});

export const getStoreCustomersQuerySchema = Joi.object({
  storeId: objectId().required(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().allow("").optional(),
  activeFilter: Joi.boolean().optional(),
  sortFilter: Joi.string().valid("nameAsc", "nameDesc", "newest", "oldest").optional(),
  roleFilter: Joi.string().valid(ACCOUNT_TYPE.USER).optional(),
});
