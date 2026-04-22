import Joi from "joi";
import { objectId } from "../common";

const togglesValidation = Joi.object({
  orderPlaced: Joi.boolean().default(true),
  orderCancelled: Joi.boolean().default(true),
  orderShipped: Joi.boolean().default(true),
  paymentSuccess: Joi.boolean().default(true),
  lowStockAlert: Joi.boolean().default(false),
});

export const upsertNotificationSettingSchema = Joi.object({
  storeId: objectId().required(),
  emailNotifications: togglesValidation.default(),
  smsNotifications: togglesValidation.default(),
  senderEmail: Joi.string().email().lowercase().trim().optional(),
  senderName: Joi.string().trim().optional(),
});

export const getNotificationSettingSchema = Joi.object({
  storeId: objectId().required(),
});
