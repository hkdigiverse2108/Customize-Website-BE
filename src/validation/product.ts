import Joi from "joi";
import { objectId } from "./common";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const productStatuses = ["draft", "active", "archived"];
const productCurrencies = ["INR"];
const productMediaTypes = ["image", "video"];

const sanitizeString = (value: any = "") => String(value || "").trim();

const normalizeSlug = (value: string = "") =>
  sanitizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const slugSchema = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const normalizedValue = normalizeSlug(value);
    if (!normalizedValue) return helpers.error("any.invalid");
    if (!slugRegex.test(normalizedValue)) return helpers.error("string.pattern.base");
    return normalizedValue;
  }, "Slug Normalization");

const optionSchema = Joi.object({
  name: Joi.string().trim().min(1).max(80).required(),
  values: Joi.array().items(Joi.string().trim().min(1).max(80)).min(1).required(),
});

const optionValueSchema = Joi.object({
  name: Joi.string().trim().min(1).max(80).required(),
  value: Joi.string().trim().min(1).max(80).required(),
});

const inventorySchema = Joi.object({
  quantity: Joi.number().min(0).default(0),
  trackQuantity: Joi.boolean().default(true),
  allowBackorder: Joi.boolean().default(false),
  lowStockThreshold: Joi.number().integer().min(0).default(5),
});

const variantSchema = Joi.object({
  title: Joi.string().trim().min(1).max(180).required(),
  optionValues: Joi.array().items(optionValueSchema).default([]),
  price: Joi.number().min(0).optional(),
  comparePrice: Joi.number().min(0).optional(),
  costPrice: Joi.number().min(0).optional(),
  sku: Joi.string().trim().allow("").optional(),
  barcode: Joi.string().trim().allow("").optional(),
  image: Joi.string().trim().allow("").optional(),
  inventory: inventorySchema.optional(),
  isActive: Joi.boolean().optional(),
});

const mediaSchema = Joi.object({
  url: Joi.string().trim().min(1).required(),
  type: Joi.string().trim().lowercase().valid(...productMediaTypes).required(),
  alt: Joi.string().trim().allow("").optional(),
  position: Joi.number().integer().min(0).optional(),
});

const seoSchema = Joi.object({
  title: Joi.string().trim().allow("").optional(),
  description: Joi.string().trim().allow("").optional(),
});

const withVariantConsistency = (value: any, helpers) => {
  const hasVariants = value?.hasVariants === true;
  const variants = Array.isArray(value?.variants) ? value.variants : [];

  if (hasVariants && variants.length === 0) {
    return helpers.error("any.custom", { message: "variants are required when hasVariants is true" });
  }

  return value;
};

export const createProductSchema = Joi.object({
  storeId: objectId().required().invalid(null),
  title: Joi.string().trim().min(2).max(180).required(),
  slug: slugSchema.default((parent) => parent?.title).optional(),
  description: Joi.string().trim().allow("").optional(),
  shortDescription: Joi.string().trim().allow("").optional(),
  status: Joi.string().trim().lowercase().valid(...productStatuses).optional(),
  vendor: Joi.string().trim().allow("").max(140).optional(),
  productType: Joi.string().trim().allow("").max(140).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  price: Joi.number().min(0).optional(),
  comparePrice: Joi.number().min(0).optional(),
  costPrice: Joi.number().min(0).optional(),
  currency: Joi.string().trim().uppercase().valid(...productCurrencies).optional(),
  options: Joi.array().items(optionSchema).optional(),
  variants: Joi.array().items(variantSchema).optional(),
  hasVariants: Joi.boolean().optional(),
  media: Joi.array().items(mediaSchema).optional(),
  thumbnail: Joi.string().trim().allow("").optional(),
  categoryIds: Joi.array().items(objectId()).optional(),
  collectionIds: Joi.array().items(objectId()).optional(),
  seo: seoSchema.optional(),
  rating: Joi.number().min(0).max(5).optional(),
  reviewCount: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
  publishedAt: Joi.date().allow(null).optional(),
}).custom(withVariantConsistency, "Variant Consistency");

export const updateProductSchema = Joi.object({
  title: Joi.string().trim().min(2).max(180).optional(),
  slug: slugSchema.optional(),
  description: Joi.string().trim().allow("").optional(),
  shortDescription: Joi.string().trim().allow("").optional(),
  status: Joi.string().trim().lowercase().valid(...productStatuses).optional(),
  vendor: Joi.string().trim().allow("").max(140).optional(),
  productType: Joi.string().trim().allow("").max(140).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  price: Joi.number().min(0).optional(),
  comparePrice: Joi.number().min(0).optional(),
  costPrice: Joi.number().min(0).optional(),
  currency: Joi.string().trim().uppercase().valid(...productCurrencies).optional(),
  options: Joi.array().items(optionSchema).optional(),
  variants: Joi.array().items(variantSchema).optional(),
  hasVariants: Joi.boolean().optional(),
  media: Joi.array().items(mediaSchema).optional(),
  thumbnail: Joi.string().trim().allow("").optional(),
  categoryIds: Joi.array().items(objectId()).optional(),
  collectionIds: Joi.array().items(objectId()).optional(),
  seo: seoSchema.optional(),
  rating: Joi.number().min(0).max(5).optional(),
  reviewCount: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
  publishedAt: Joi.date().allow(null).optional(),
}).min(1).custom(withVariantConsistency, "Variant Consistency");

export const productIdSchema = Joi.object({
  id: objectId().required().invalid(null),
});

export const getAllProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().allow("").optional(),
  activeFilter: Joi.boolean().optional(),
  storeId: objectId().optional(),
  statusFilter: Joi.string().trim().lowercase().valid(...productStatuses).optional(),
  vendorFilter: Joi.string().trim().optional(),
  productTypeFilter: Joi.string().trim().optional(),
  categoryId: objectId().optional(),
  collectionId: objectId().optional(),
  hasVariantsFilter: Joi.boolean().optional(),
  tag: Joi.string().trim().optional(),
  sortFilter: Joi.string().valid("nameAsc", "nameDesc", "newest", "oldest", "priceAsc", "priceDesc").optional(),
  startDateFilter: Joi.date().optional(),
  endDateFilter: Joi.date().optional(),
});
