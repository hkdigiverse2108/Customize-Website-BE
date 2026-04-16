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

export const CommonFieldSchema = {
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  activeFilter: Joi.boolean().optional(),
};
