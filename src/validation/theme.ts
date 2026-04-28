import Joi from "joi";
import { objectId } from "./common";
import { THEME_SUPPORTED_PAGES } from "../type/theme";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const themeStylesSchema = Joi.object({
  colors: Joi.object({
    primary: Joi.string().trim().allow("").optional(),
    secondary: Joi.string().trim().allow("").optional(),
    background: Joi.string().trim().allow("").optional(),
    text: Joi.string().trim().allow("").optional(),
  })
    .unknown(true)
    .optional(),
  fonts: Joi.object({
    heading: Joi.string().trim().allow("").optional(),
    body: Joi.string().trim().allow("").optional(),
  })
    .unknown(true)
    .optional(),
  layout: Joi.object({
    containerWidth: Joi.string().trim().valid("full", "boxed").optional(),
    spacing: Joi.string().trim().allow("").optional(),
  })
    .unknown(true)
    .optional(),
})
  .unknown(true)
  .optional();

const themeLayoutItemSchema = Joi.object({
  componentId: objectId().required(),
  order: Joi.number().integer().min(0).required(),
  config: Joi.object().unknown(true).default({}),
}).unknown(true);

const themeLayoutPageSchema = Joi.array().items(themeLayoutItemSchema).optional();

const themeLayoutSchema = Joi.object({
  header: themeLayoutPageSchema,
  footer: themeLayoutPageSchema,
  home: themeLayoutPageSchema,
  product: themeLayoutPageSchema,
  category: themeLayoutPageSchema,
  cart: themeLayoutPageSchema,
  checkout: themeLayoutPageSchema,
  custom: themeLayoutPageSchema,
  collection: themeLayoutPageSchema,
}).optional();

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
  .unknown(true)
  .optional();

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
  storeId: objectId().allow(null).optional(),
  isGlobal: Joi.boolean().optional(),
  isPremium: Joi.boolean().optional(),
  price: Joi.number().min(0).optional(),
  styles: themeStylesSchema,
  layoutJSON: themeLayoutSchema,
  draftLayoutJSON: themeLayoutSchema,
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
  createdBy: objectId().optional(),
  sortFilter: Joi.string().valid("nameAsc", "nameDesc", "newest", "oldest").optional(),
  startDateFilter: Joi.date().optional(),
  endDateFilter: Joi.date().optional(),
});
