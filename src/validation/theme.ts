import Joi from "joi";
import { objectId, settingItemSchema, schemaItemSchema } from "./common";


import { THEME_SUPPORTED_PAGES, THEME_TYPES } from "../type/theme";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const themeStylesSchema = Joi.array().items(settingItemSchema).optional();



const themeLayoutItemSchema = Joi.object({
  componentId: objectId().required(),
  order: Joi.number().integer().min(0).required(),
  config: Joi.array().items(settingItemSchema).default([]),
}).unknown(true);



const themePageLayoutSchema = Joi.object({
  page: Joi.string().trim().required(),
  sections: Joi.array().items(themeLayoutItemSchema).default([]),
});

const themeLayoutSchema = Joi.array().items(themePageLayoutSchema).optional();


const defaultConfigSchema = Joi.array().items(settingItemSchema).optional();



const breakpointsSchema = Joi.array().items(settingItemSchema).optional();

const changelogSchema = Joi.object({
  version: Joi.string().trim().allow("").optional(),
  changes: Joi.string().trim().allow("").optional(),
  date: Joi.date().optional(),
})
  .unknown(true)
  .optional();

const themeSharedFields = {
  description: Joi.string().trim().allow("").optional(),
  previewImage: Joi.string().trim().uri().allow("").optional(),
  demoUrl: Joi.string().trim().uri().allow("").optional(),
  category: Joi.string().trim().allow("").optional(),
  tags: Joi.array().items(Joi.string().trim().min(1)).optional(),
  type: Joi.string().trim().lowercase().valid(...THEME_TYPES).optional(),
  storeId: objectId().allow(null).optional(),
  isGlobal: Joi.boolean().optional(),
  isPremium: Joi.boolean().optional(),
  price: Joi.number().min(0).optional(),
  styles: themeStylesSchema,
  layoutJSON: themeLayoutSchema,
  draftLayoutJSON: themeLayoutSchema,
  componentSchema: Joi.array().items(schemaItemSchema).optional(),
  settingsSchema: Joi.array().items(schemaItemSchema).optional(),

  defaultConfig: defaultConfigSchema,
  supportedComponents: Joi.array().items(Joi.string().trim().min(1)).optional(),
  supportedPages: Joi.array()
    .items(Joi.string().trim().lowercase().valid(...THEME_SUPPORTED_PAGES))
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
};

export const createThemeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).required(),
  slug: Joi.string().trim().lowercase().pattern(slugRegex).required(),
  ...themeSharedFields,
});

export const updateThemeSchema = Joi.object({
  ...themeSharedFields,
  name: Joi.string().trim().min(2).max(160).optional(),
  slug: Joi.string().trim().lowercase().pattern(slugRegex).optional(),
}).min(1);

export const themeIdSchema = Joi.object({
  id: objectId().required(),
});

export const getAllThemesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().allow("").optional(),
  activeFilter: Joi.boolean().optional(),
  isPremiumFilter: Joi.boolean().optional(),
  storeId: objectId().optional(),
  category: Joi.string().trim().allow("").optional(),
  tag: Joi.string().trim().allow("").optional(),
  supportedPage: Joi.string()
    .trim()
    .lowercase()
    .valid(...THEME_SUPPORTED_PAGES)
    .optional(),
  typeFilter: Joi.string().trim().lowercase().valid(...THEME_TYPES).optional(),
  createdBy: objectId().optional(),
  sortFilter: Joi.string().valid("nameAsc", "nameDesc", "newest", "oldest").optional(),
  startDateFilter: Joi.date().optional(),
  endDateFilter: Joi.date().optional(),
});
