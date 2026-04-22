import Joi from "joi";
import { objectId } from "../common";

export const upsertCheckoutSettingSchema = Joi.object({
  storeId: objectId().required(),
  customerAccounts: Joi.string().valid("disabled", "optional", "required").default("optional"),
  contactMethod: Joi.string().valid("email", "phone_or_email").default("email"),
  allowGuestCheckout: Joi.boolean().default(true),
  requirePhoneNumber: Joi.boolean().default(false),
  companyNameField: Joi.string().valid("hidden", "optional", "required").default("optional"),
  addressLine2Field: Joi.string().valid("hidden", "optional", "required").default("optional"),
  orderProcessing: Joi.object({
    useShippingAsBillingByDefault: Joi.boolean().default(true),
    enableAddressAutocompletion: Joi.boolean().default(false),
  }).default(),
  abandonedCart: Joi.object({
    enabled: Joi.boolean().default(false),
    sendEmailAfterHours: Joi.number().min(1).max(72).default(10),
  }).default(),
});

export const getCheckoutSettingSchema = Joi.object({
  storeId: objectId().required(),
});
