import Joi from "joi";
import { objectId } from "./common";
import { COLLECTION_TYPE, COLLECTION_STATUS, COLLECTION_RULE_CONDITION, COLLECTION_RULE_FIELD, COLLECTION_OPERATOR, COLLECTION_SORT_ORDER } from "../common";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const collectionRuleSchema = Joi.object({
  field: Joi.string().trim().valid(...Object.values(COLLECTION_RULE_FIELD)).required(),
  operator: Joi.string().trim().valid(...Object.values(COLLECTION_OPERATOR)).required(),
  value: Joi.any().required(),
});

const collectionImageSchema = Joi.object({
  url: Joi.string().trim().allow("").optional(),
  alt: Joi.string().trim().allow("").optional(),
});

const collectionSeoSchema = Joi.object({
  title: Joi.string().trim().allow("").optional(),
  description: Joi.string().trim().allow("").optional(),
});

const sanitizeString = (value: any = "") => String(value || "").trim();

const normalizeHandle = (value: string = "") =>
  sanitizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const handleSchema = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const normalizedValue = normalizeHandle(value);
    if (!normalizedValue) return helpers.error("any.invalid");
    if (!slugRegex.test(normalizedValue)) return helpers.error("string.pattern.base");
    return normalizedValue;
  }, "Handle Normalization");

export const createCollectionSchema = Joi.object({
  storeId: objectId().required().invalid(null),
  title: Joi.string().trim().min(2).max(180).required(),
  handle: handleSchema.default((parent) => parent?.title).optional(),
  type: Joi.string().trim().lowercase().valid(...Object.values(COLLECTION_TYPE)).optional(),
  status: Joi.string().trim().lowercase().valid(...Object.values(COLLECTION_STATUS)).optional(),
  isPublished: Joi.boolean().optional(),
  publishedAt: Joi.date().allow(null).optional(),
  description: Joi.string().trim().allow("").optional(),
  productIds: Joi.array().items(objectId()).optional(),
  rules: Joi.array().items(collectionRuleSchema).optional(),
  ruleCondition: Joi.string().trim().uppercase().valid(...Object.values(COLLECTION_RULE_CONDITION)).optional(),
  sortOrder: Joi.string().trim().valid(...Object.values(COLLECTION_SORT_ORDER)).optional(),
  image: collectionImageSchema.optional(),
  seo: collectionSeoSchema.optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  isActive: Joi.boolean().optional(),
});

export const updateCollectionSchema = Joi.object({
  storeId: objectId().optional(),
  title: Joi.string().trim().min(2).max(180).optional(),
  handle: handleSchema.optional(),
  type: Joi.string().trim().lowercase().valid(...Object.values(COLLECTION_TYPE)).optional(),
  status: Joi.string().trim().lowercase().valid(...Object.values(COLLECTION_STATUS)).optional(),
  isPublished: Joi.boolean().optional(),
  publishedAt: Joi.date().allow(null).optional(),
  description: Joi.string().trim().allow("").optional(),
  productIds: Joi.array().items(objectId()).optional(),
  rules: Joi.array().items(collectionRuleSchema).optional(),
  ruleCondition: Joi.string().trim().uppercase().valid(...Object.values(COLLECTION_RULE_CONDITION)).optional(),
  sortOrder: Joi.string().trim().valid(...Object.values(COLLECTION_SORT_ORDER)).optional(),
  image: collectionImageSchema.optional(),
  seo: collectionSeoSchema.optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

export const collectionIdSchema = Joi.object({
  id: objectId().required().invalid(null),
});

export const getAllCollectionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().allow("").optional(),
  activeFilter: Joi.boolean().optional(),
  storeId: objectId().optional(),
  typeFilter: Joi.string().trim().lowercase().valid(...Object.values(COLLECTION_TYPE)).optional(),
  statusFilter: Joi.string().trim().lowercase().valid(...Object.values(COLLECTION_STATUS)).optional(),
  publishedFilter: Joi.boolean().optional(),
  tag: Joi.string().trim().optional(),
  sortFilter: Joi.string().valid("nameAsc", "nameDesc", "newest", "oldest").optional(),
  startDateFilter: Joi.date().optional(),
  endDateFilter: Joi.date().optional(),
});
