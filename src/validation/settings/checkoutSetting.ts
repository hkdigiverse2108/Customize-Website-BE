import Joi from "joi";
import { objectId } from "../common";
import { AUTH_METHOD, SETTING_FIELD_STATUS, VISIBILITY_STATUS } from "../../common";

export const upsertCheckoutSettingSchema = Joi.object({
  storeId: objectId().required(),
  customerAccounts: Joi.string().valid(...Object.values(SETTING_FIELD_STATUS)).default(SETTING_FIELD_STATUS.OPTIONAL),
  contactMethod: Joi.string().valid(...Object.values(AUTH_METHOD)).default(AUTH_METHOD.EMAIL),
  allowGuestCheckout: Joi.boolean().default(true),
  requirePhoneNumber: Joi.boolean().default(false),
  companyNameField: Joi.string().valid(...Object.values(VISIBILITY_STATUS)).default(VISIBILITY_STATUS.OPTIONAL),
  addressLine2Field: Joi.string().valid(...Object.values(VISIBILITY_STATUS)).default(VISIBILITY_STATUS.OPTIONAL),
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
