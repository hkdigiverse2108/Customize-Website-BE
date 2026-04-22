import Joi from "joi";
import { objectId } from "../common";

export const upsertRegionSettingSchema = Joi.object({
  storeId: objectId().required(),
  currency: Joi.string().trim().default("INR"),
  currencySymbol: Joi.string().trim().default("₹"),
  timezone: Joi.string().trim().default("Asia/Kolkata"),
  unitSystem: Joi.string().valid("metric", "imperial").default("metric"),
  weightUnit: Joi.string().trim().default("kg"),
  lengthUnit: Joi.string().trim().default("cm"),
});

export const getRegionSettingSchema = Joi.object({
  storeId: objectId().required(),
});
