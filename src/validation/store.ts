import Joi from "joi";
import { KYC_DOCUMENT_TYPE, KYC_STATUS } from "../common";
import { objectId } from "./common";

const externalScriptSchema = Joi.object({
  name: Joi.string().trim().allow("").optional(),
  src: Joi.string().trim().allow("").optional(),
  position: Joi.string().trim().lowercase().valid("head", "body_start", "body_end").optional(),
  isActive: Joi.boolean().optional(),
}).unknown(true);

const socialLinksSchema = Joi.object({
  facebook: Joi.string().trim().allow("").optional(),
  instagram: Joi.string().trim().allow("").optional(),
  twitter: Joi.string().trim().allow("").optional(),
  youtube: Joi.string().trim().allow("").optional(),
  linkedin: Joi.string().trim().allow("").optional(),
}).unknown(true);

export const kycDocumentSchema = Joi.object({
  type: Joi.string().trim().lowercase().valid(...Object.values(KYC_DOCUMENT_TYPE)).required(),
  documentUrl: Joi.string().trim().uri().required(),
  verified: Joi.boolean().optional(),
});

export const addressSchema = Joi.object({
  country: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  pincode: Joi.string().trim().required(),
  addressLine1: Joi.string().trim().required(),
  addressLine2: Joi.string().trim().allow("").optional(),
  landmark: Joi.string().trim().allow("").optional(),
});

export const createStoreSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  slug: Joi.string().trim().lowercase().required(),
  description: Joi.string().trim().allow("").optional(),
  logo: Joi.string().trim().allow(null, "").optional(),
  banner: Joi.string().trim().allow(null, "").optional(),
  themeIds: Joi.array().items(objectId()).unique().optional(),
  userId: objectId().optional(),
  subdomain: Joi.string().trim().lowercase().required(),
  customDomain: Joi.string().trim().lowercase().allow(null, "").optional(),
  domainVerified: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  isPublished: Joi.boolean().optional(),
  businessName: Joi.string().trim().min(2).max(150).required(),
  businessType: Joi.string().trim().required(),
  gstNumber: Joi.string().trim().allow("").optional(),
  panNumber: Joi.string().trim().uppercase().allow("").optional(),
  kycStatus: Joi.string().trim().lowercase().valid(...Object.values(KYC_STATUS)).optional(),
  kycDocuments: Joi.array().items(kycDocumentSchema).optional(),
  address: addressSchema.optional(),
  externalScripts: Joi.array().items(externalScriptSchema).optional(),
  socialLinks: socialLinksSchema.optional(),
  email: Joi.string().trim().email().lowercase().required(),
  phone: Joi.string().trim().min(6).max(20).required(),
  totalProducts: Joi.number().min(0).optional(),
  totalOrders: Joi.number().min(0).optional(),
  totalRevenue: Joi.number().min(0).optional(),
});

export const updateStoreSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  slug: Joi.string().trim().lowercase().optional(),
  description: Joi.string().trim().allow("").optional(),
  logo: Joi.string().trim().allow(null, "").optional(),
  banner: Joi.string().trim().allow(null, "").optional(),
  themeIds: Joi.array().items(objectId()).unique().optional(),
  userId: objectId().optional(),
  subdomain: Joi.string().trim().lowercase().optional(),
  customDomain: Joi.string().trim().lowercase().allow(null, "").optional(),
  domainVerified: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  isPublished: Joi.boolean().optional(),
  businessName: Joi.string().trim().min(2).max(150).optional(),
  businessType: Joi.string().trim().optional(),
  gstNumber: Joi.string().trim().allow("").optional(),
  panNumber: Joi.string().trim().uppercase().allow("").optional(),
  kycStatus: Joi.string().trim().lowercase().valid(...Object.values(KYC_STATUS)).optional(),
  kycDocuments: Joi.array().items(kycDocumentSchema).optional(),
  address: addressSchema.optional(),
  externalScripts: Joi.array().items(externalScriptSchema).optional(),
  socialLinks: socialLinksSchema.optional(),
  email: Joi.string().trim().email().lowercase().optional(),
  phone: Joi.string().trim().min(6).max(20).optional(),
  totalProducts: Joi.number().min(0).optional(),
  totalOrders: Joi.number().min(0).optional(),
  totalRevenue: Joi.number().min(0).optional(),
}).min(1);

export const storeIdSchema = Joi.object({
  id: objectId().required(),
});

export const getAllStoresQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().allow("").optional(),
  activeFilter: Joi.boolean().optional(),
  isPublishedFilter: Joi.boolean().optional(),
  kycStatusFilter: Joi.string().trim().lowercase().valid(...Object.values(KYC_STATUS)).optional(),
  userId: objectId().optional(),
  sortFilter: Joi.string().valid("nameAsc", "nameDesc", "newest", "oldest").optional(),
  startDateFilter: Joi.date().optional(),
  endDateFilter: Joi.date().optional(),
});
