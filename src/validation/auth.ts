import Joi from "joi";
import { ACCOUNT_TYPE, SUBSCRIPTION_STATUS, SUBSCRIPTION_TYPE } from "../common";
import { objectId } from "./common";

export const subscriptionSchema = Joi.object({
  planId: objectId().optional(),
  type: Joi.string().valid(...Object.values(SUBSCRIPTION_TYPE)).required(),
  status: Joi.string().valid(...Object.values(SUBSCRIPTION_STATUS)).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().allow(null).min(Joi.ref("startDate")).optional(),
  autoRenew: Joi.boolean().required(),
});

export const createUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).required(),
  lastName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid(...Object.values(ACCOUNT_TYPE)).required(),
  subscription: subscriptionSchema.optional(),
  trialUsed: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).optional(),
  lastName: Joi.string().trim().min(2).max(100).optional(),
  email: Joi.string().trim().email().lowercase().optional(),
  password: Joi.string().min(8).optional(),
  role: Joi.string().valid(...Object.values(ACCOUNT_TYPE)).optional(),
  subscription: subscriptionSchema.optional(),
  trialUsed: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

export const signupSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).required(),
  lastName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid(ACCOUNT_TYPE.VENDOR).optional(),
  subscription: subscriptionSchema.optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string().min(8).required(),
});

export const googleAuthSchema = Joi.object({
  credential: Joi.string().trim().required(),
});

export const verifyLoginOtpSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
  otp: Joi.number().integer().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
  otp: Joi.number().integer().optional(),
  password: Joi.string().min(8).required(),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(8).required(),
  newPassword: Joi.string().min(8).required(),
});
