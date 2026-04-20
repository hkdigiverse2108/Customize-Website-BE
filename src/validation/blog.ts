import Joi from "joi";

const blogSeoSchema = Joi.object({
  title: Joi.string().allow(""),
  description: Joi.string().allow(""),
  slug: Joi.string().required(),
});

export const createBlogSchema = Joi.object({
  storeId: Joi.string().required(),
  title: Joi.string().required(),
  content: Joi.string().allow(""),
  excerpt: Joi.string().allow(""),
  author: Joi.string().allow(""),
  image: Joi.string().allow(""),
  status: Joi.string().valid("visible", "hidden"),
  tags: Joi.array().items(Joi.string()),
  blogCategory: Joi.string(),
  themeId: Joi.string().allow(null, ""),
  seo: blogSeoSchema.required(),
  publishedAt: Joi.date().allow(null),
});

export const updateBlogSchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string(),
  content: Joi.string().allow(""),
  excerpt: Joi.string().allow(""),
  author: Joi.string().allow(""),
  image: Joi.string().allow(""),
  status: Joi.string().valid("visible", "hidden"),
  tags: Joi.array().items(Joi.string()),
  blogCategory: Joi.string(),
  themeId: Joi.string().allow(null, ""),
  seo: blogSeoSchema,
  publishedAt: Joi.date().allow(null),
  isActive: Joi.boolean(),
});

export const getAllBlogsQuerySchema = Joi.object({
  storeId: Joi.string(),
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
  search: Joi.string().allow(""),
  status: Joi.string().valid("visible", "hidden"),
  blogCategory: Joi.string(),
  sort: Joi.string(),
  order: Joi.string().valid("asc", "desc"),
});
