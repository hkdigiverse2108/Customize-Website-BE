import Joi from "joi";
import { objectId } from "./common";

const componentTypes = ["header", "footer", "banner", "productGrid", "custom"];
const componentCategories = ["layout", "marketing", "ecommerce"];
const supportedPages = ["home", "product", "category", "cart", "checkout", "custom"];

export const createComponentSchema = Joi.object({
  storeId: objectId().allow(null).optional(),
  sourceComponentId: objectId().allow(null).optional(),
  name: Joi.string().trim().min(2).max(160).required(),
  type: Joi.string().trim().valid(...componentTypes).required(),
  category: Joi.string().trim().valid(...componentCategories).allow(null, "").optional(),
  label: Joi.string().trim().allow("").optional(),
  icon: Joi.string().trim().allow("").optional(),
  previewImage: Joi.string().trim().allow("").optional(),
  configJSON: Joi.object().unknown(true).optional(),
  defaultConfig: Joi.object().unknown(true).optional(),
  configSchema: Joi.object().unknown(true).optional(),
  isReusable: Joi.boolean().optional(),
  isGlobal: Joi.boolean().optional(),
  supportedPages: Joi.array().items(Joi.string().trim().valid(...supportedPages)).optional(),
  supportedThemes: Joi.array().items(objectId()).optional(),
  version: Joi.string().trim().allow("").optional(),
  isDeprecated: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
});

export const updateComponentSchema = Joi.object({
  storeId: objectId().allow(null).optional(),
  sourceComponentId: objectId().allow(null).optional(),
  name: Joi.string().trim().min(2).max(160).optional(),
  type: Joi.string().trim().valid(...componentTypes).optional(),
  category: Joi.string().trim().valid(...componentCategories).allow(null, "").optional(),
  label: Joi.string().trim().allow("").optional(),
  icon: Joi.string().trim().allow("").optional(),
  previewImage: Joi.string().trim().allow("").optional(),
  configJSON: Joi.object().unknown(true).optional(),
  defaultConfig: Joi.object().unknown(true).optional(),
  configSchema: Joi.object().unknown(true).optional(),
  isReusable: Joi.boolean().optional(),
  isGlobal: Joi.boolean().optional(),
  supportedPages: Joi.array().items(Joi.string().trim().valid(...supportedPages)).optional(),
  supportedThemes: Joi.array().items(objectId()).optional(),
  version: Joi.string().trim().allow("").optional(),
  isDeprecated: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

export const componentIdSchema = Joi.object({
  id: objectId().required(),
});

export const customizeComponentSchema = Joi.object({
  storeId: objectId().required(),
  componentId: objectId().required(),
  name: Joi.string().trim().min(2).max(160).optional(),
  label: Joi.string().trim().allow("").optional(),
  icon: Joi.string().trim().allow("").optional(),
  previewImage: Joi.string().trim().allow("").optional(),
  configJSON: Joi.object().unknown(true).optional(),
  defaultConfig: Joi.object().unknown(true).optional(),
  configSchema: Joi.object().unknown(true).optional(),
  supportedPages: Joi.array().items(Joi.string().trim().valid(...supportedPages)).optional(),
  supportedThemes: Joi.array().items(objectId()).optional(),
  version: Joi.string().trim().allow("").optional(),
  isReusable: Joi.boolean().optional(),
  isDeprecated: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
}).min(3);

export const getAllComponentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().allow("").optional(),
  activeFilter: Joi.boolean().optional(),
  reusableFilter: Joi.boolean().optional(),
  globalFilter: Joi.boolean().optional(),
  deprecatedFilter: Joi.boolean().optional(),
  type: Joi.string().trim().valid(...componentTypes).optional(),
  category: Joi.string().trim().valid(...componentCategories).optional(),
  supportedPage: Joi.string().trim().valid(...supportedPages).optional(),
  storeId: objectId().optional(),
  themeId: objectId().optional(),
  sortFilter: Joi.string().valid("nameAsc", "nameDesc", "newest", "oldest").optional(),
  startDateFilter: Joi.date().optional(),
  endDateFilter: Joi.date().optional(),
});
