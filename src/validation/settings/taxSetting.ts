import Joi from "joi";
import { objectId } from "../common";

export const upsertTaxSettingSchema = Joi.object({
  storeId: objectId().required(),
  taxEnabled: Joi.boolean().default(false),
  taxName: Joi.string().trim().default("GST"),
  taxPercentage: Joi.number().min(0).max(100).default(0),
  isTaxIncluded: Joi.boolean().default(false),
  gstNumber: Joi.string().trim().allow("").default(""),
});

export const getTaxSettingSchema = Joi.object({
  storeId: objectId().required(),
});
