import Joi from "joi";
import mongoose from "mongoose";

export const objectId = () =>
  Joi.string()
    .custom((value, helpers) => {
      if (!mongoose?.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "ObjectId Validation")
    .allow(null);

export const commonApiSchema = {
  isActive: Joi.boolean().optional(),
};


export const commonIdSchema = Joi.object({
  id: objectId().required(),
});

export const settingItemSchema = Joi.object({
  key: Joi.string().trim().required(),
  value: Joi.any().optional(),
  type: Joi.string().trim().optional(),
  label: Joi.string().trim().optional(),
  group: Joi.string().trim().optional(),
});

export const schemaItemSchema = Joi.object({
  key: Joi.string().trim().required(),
  type: Joi.string().trim().required(),
  label: Joi.string().trim().allow("").optional(),
  default: Joi.any().optional(),
  options: Joi.array().items(Joi.any()).optional(),
  group: Joi.string().trim().allow("").optional(),
  placeholder: Joi.string().trim().allow("").optional(),
  validation: Joi.object().unknown(true).optional(),
});

export const CommonFieldSchema = {


  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  activeFilter: Joi.boolean().optional(),
};
