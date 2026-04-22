import Joi from "joi";
import { objectId } from "../common";

export const addShippingSettingSchema = Joi.object({
  storeId: objectId().required(),
  zoneName: Joi.string().trim().required(),
  countries: Joi.array().items(Joi.string()).default([]),
  rates: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().required(),
      price: Joi.number().min(0).required(),
      minOrderValue: Joi.number().min(0).optional(),
      maxOrderValue: Joi.number().min(0).optional(),
    })
  ).min(1).required(),
  isActive: Joi.boolean().default(true),
});

export const updateShippingSettingSchema = Joi.object({
  shippingSettingId: objectId().required(),
  zoneName: Joi.string().trim().optional(),
  countries: Joi.array().items(Joi.string()).optional(),
  rates: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().required(),
      price: Joi.number().min(0).required(),
      minOrderValue: Joi.number().min(0).optional(),
      maxOrderValue: Joi.number().min(0).optional(),
    })
  ).optional(),
  isActive: Joi.boolean().optional(),
});

export const getShippingSettingsQuerySchema = Joi.object({
  storeId: objectId().required(),
});

export const deleteShippingSettingSchema = Joi.object({
  shippingSettingId: objectId().required(),
});
