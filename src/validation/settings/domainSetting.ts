import Joi from "joi";
import { objectId } from "../common";
import { VERIFICATION_STATUS } from "../../common";

export const addDomainSettingSchema = Joi.object({
  storeId: objectId().required(),
  themeId: objectId().optional(),
  domain: Joi.string().trim().lowercase().required(),
  isPrimary: Joi.boolean().default(false),
});

export const updateDomainSettingSchema = Joi.object({
  domainSettingId: objectId().required(),
  themeId: objectId().optional(),
  isPrimary: Joi.boolean().optional(),
  status: Joi.string().valid(...Object.values(VERIFICATION_STATUS)).optional(),
  sslEnabled: Joi.boolean().optional(),
});

export const getDomainSettingsQuerySchema = Joi.object({
  storeId: objectId().required(),
});

export const deleteDomainSettingSchema = Joi.object({
  domainSettingId: objectId().required(),
});
