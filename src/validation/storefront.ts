import Joi from "joi";
import { THEME_SUPPORTED_PAGES } from "../type/theme";

export const storefrontPageQuerySchema = Joi.object({
  slug: Joi.string().trim().lowercase().optional(),
  domain: Joi.string().trim().lowercase().optional(),
  page: Joi.string().valid(...THEME_SUPPORTED_PAGES).default("home"),
  isPreview: Joi.boolean().default(false), // Preview mode for builders
}).custom((value, helpers) => {
  if (!value.slug && !value.domain) {
    return helpers.error("any.invalid");
  }

  return value;
}).messages({
  "any.invalid": "slug or domain is required",
});
