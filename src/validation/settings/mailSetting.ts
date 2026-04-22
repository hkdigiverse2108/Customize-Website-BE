import Joi from "joi";
import { objectId } from "../common";
import { EMAIL_PROVIDER } from "../../common";

export const upsertMailSettingSchema = Joi.object({
  storeId: objectId().required(),
  provider: Joi.string().valid(...Object.values(EMAIL_PROVIDER)).default(EMAIL_PROVIDER.SMTP),
  host: Joi.string().trim().when("provider", { is: "smtp", then: Joi.required() }),
  port: Joi.number().when("provider", { is: "smtp", then: Joi.required() }),
  secure: Joi.boolean().default(true),
  auth: Joi.object({
    user: Joi.string().trim().required(),
    pass: Joi.string().trim().required(),
  }).required(),
  fromEmail: Joi.string().email().lowercase().trim().required(),
  fromName: Joi.string().trim().required(),
});

export const getMailSettingSchema = Joi.object({
  storeId: objectId().required(),
});
