import Joi from "joi";
import { objectId } from "../common";

export const addDomainSettingSchema = Joi.object({
  storeId: objectId().required(),
  domain: Joi.string().trim().lowercase().required(),
  isPrimary: Joi.boolean().default(false),
});

export const updateDomainSettingSchema = Joi.object({
  domainSettingId: objectId().required(),
  isPrimary: Joi.boolean().optional(),
  status: Joi.string().valid("pending", "verified", "failed").optional(),
  sslEnabled: Joi.boolean().optional(),
});

export const getDomainSettingsQuerySchema = Joi.object({
  storeId: objectId().required(),
});

export const deleteDomainSettingSchema = Joi.object({
  domainSettingId: objectId().required(),
});
