import Joi from "joi";
import { objectId } from "./common";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const pageTypes = ["home", "product", "category", "custom"];
const pageVisibilities = ["public", "private", "password"];

export const createPageSchema = Joi.object({
  storeId: objectId().required(),
  title: Joi.string().trim().min(2).max(160).required(),
  slug: Joi.string().trim().lowercase().pattern(slugRegex).required(),
  description: Joi.string().trim().allow("").optional(),
  type: Joi.string().trim().lowercase().valid(...pageTypes).optional(),
  layoutJSON: Joi.object().unknown(true).required(),
  metaTitle: Joi.string().trim().allow("").optional(),
  metaDescription: Joi.string().trim().allow("").optional(),
  metaKeywords: Joi.array().items(Joi.string().trim().min(1)).optional(),
  isPublished: Joi.boolean().optional(),
  isHomePage: Joi.boolean().optional(),
  version: Joi.number().integer().min(1).optional(),
  isDraft: Joi.boolean().optional(),
  visibility: Joi.string().trim().lowercase().valid(...pageVisibilities).optional(),
  password: Joi.string().trim().allow("").optional(),
});

export const updatePageSchema = Joi.object({
  title: Joi.string().trim().min(2).max(160).optional(),
  slug: Joi.string().trim().lowercase().pattern(slugRegex).optional(),
  description: Joi.string().trim().allow("").optional(),
  type: Joi.string().trim().lowercase().valid(...pageTypes).optional(),
  layoutJSON: Joi.object().unknown(true).optional(),
  metaTitle: Joi.string().trim().allow("").optional(),
  metaDescription: Joi.string().trim().allow("").optional(),
  metaKeywords: Joi.array().items(Joi.string().trim().min(1)).optional(),
  isPublished: Joi.boolean().optional(),
  isHomePage: Joi.boolean().optional(),
  version: Joi.number().integer().min(1).optional(),
  isDraft: Joi.boolean().optional(),
  visibility: Joi.string().trim().lowercase().valid(...pageVisibilities).optional(),
  password: Joi.string().trim().allow("").optional(),
}).min(1);

export const pageIdSchema = Joi.object({
  id: objectId().required(),
});

export const getAllPagesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().allow("").optional(),
  activeFilter: Joi.boolean().optional(),
  sortFilter: Joi.string().valid("nameAsc", "nameDesc", "newest", "oldest").optional(),
  startDateFilter: Joi.date().optional(),
  endDateFilter: Joi.date().optional(),
  storeId: objectId().optional(),
  type: Joi.string().trim().lowercase().valid(...pageTypes).optional(),
  isPublishedFilter: Joi.boolean().optional(),
  isDraftFilter: Joi.boolean().optional(),
  visibility: Joi.string().trim().lowercase().valid(...pageVisibilities).optional(),
});
