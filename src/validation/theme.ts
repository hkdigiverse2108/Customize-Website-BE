import Joi from "joi";
import { objectId } from "./common";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const supportedPages = ["home", "product", "category", "cart", "checkout", "custom"];

const defaultConfigSchema = Joi.object({
  colors: Joi.object().unknown(true).optional(),
  fonts: Joi.object().unknown(true).optional(),
  spacing: Joi.object().unknown(true).optional(),
  buttons: Joi.object().unknown(true).optional(),
})
  .unknown(true)
  .optional();

const breakpointsSchema = Joi.object({
  mobile: Joi.number().min(0).optional(),
  tablet: Joi.number().min(0).optional(),
  desktop: Joi.number().min(0).optional(),
})
  .optional();

const changelogSchema = Joi.object({
  version: Joi.string().trim().allow("").optional(),
  changes: Joi.string().trim().allow("").optional(),
  date: Joi.date().optional(),
});

export const createThemeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).required(),
  slug: Joi.string().trim().lowercase().pattern(slugRegex).required(),
  description: Joi.string().trim().allow("").optional(),
  previewImage: Joi.string().trim().uri().allow("").optional(),
  demoUrl: Joi.string().trim().uri().allow("").optional(),
  category: Joi.string().trim().allow("").optional(),
  tags: Joi.array().items(Joi.string().trim().min(1)).optional(),
  isPremium: Joi.boolean().optional(),
  price: Joi.number().min(0).optional(),
  layoutJSON: Joi.object().unknown(true).optional(),
  supportedComponents: Joi.array().items(Joi.string().trim().min(1)).optional(),
  defaultConfig: defaultConfigSchema,
  supportedPages: Joi.array()
    .items(Joi.string().trim().lowercase().valid(...supportedPages))
    .optional(),
  isResponsive: Joi.boolean().optional(),
  breakpoints: breakpointsSchema,
  seoFriendly: Joi.boolean().optional(),
  performanceScore: Joi.number().min(0).max(100).allow(null).optional(),
  lazyLoadEnabled: Joi.boolean().optional(),
  version: Joi.string().trim().optional(),
  changelog: Joi.array().items(changelogSchema).optional(),
  createdBy: objectId().optional(),
  authorName: Joi.string().trim().allow("").optional(),
  isActive: Joi.boolean().optional(),
});

export const updateThemeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).optional(),
  slug: Joi.string().trim().lowercase().pattern(slugRegex).optional(),
  description: Joi.string().trim().allow("").optional(),
  previewImage: Joi.string().trim().uri().allow("").optional(),
  demoUrl: Joi.string().trim().uri().allow("").optional(),
  category: Joi.string().trim().allow("").optional(),
  tags: Joi.array().items(Joi.string().trim().min(1)).optional(),
  isPremium: Joi.boolean().optional(),
  price: Joi.number().min(0).optional(),
  layoutJSON: Joi.object().unknown(true).optional(),
  supportedComponents: Joi.array().items(Joi.string().trim().min(1)).optional(),
  defaultConfig: defaultConfigSchema,
  supportedPages: Joi.array()
    .items(Joi.string().trim().lowercase().valid(...supportedPages))
    .optional(),
  isResponsive: Joi.boolean().optional(),
  breakpoints: breakpointsSchema,
  seoFriendly: Joi.boolean().optional(),
  performanceScore: Joi.number().min(0).max(100).allow(null).optional(),
  lazyLoadEnabled: Joi.boolean().optional(),
  version: Joi.string().trim().optional(),
  changelog: Joi.array().items(changelogSchema).optional(),
  createdBy: objectId().optional(),
  authorName: Joi.string().trim().allow("").optional(),
  isActive: Joi.boolean().optional(),
})
  .min(1);

export const themeIdSchema = Joi.object({
  id: objectId().required(),
});

export const getAllThemesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().allow("").optional(),
  activeFilter: Joi.boolean().optional(),
  isPremiumFilter: Joi.boolean().optional(),
  category: Joi.string().trim().allow("").optional(),
  tag: Joi.string().trim().allow("").optional(),
  supportedPage: Joi.string()
    .trim()
    .lowercase()
    .valid(...supportedPages)
    .optional(),
  createdBy: objectId().optional(),
  sortFilter: Joi.string().valid("nameAsc", "nameDesc", "newest", "oldest").optional(),
  startDateFilter: Joi.date().optional(),
  endDateFilter: Joi.date().optional(),
});
