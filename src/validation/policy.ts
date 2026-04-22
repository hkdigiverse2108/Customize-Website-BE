import Joi from "joi";
import { objectId } from "./common";
import { POLICY_TYPE } from "../common";

export const addOrEditPolicySchema = Joi.object({
  storeId: objectId().required(),
  type: Joi.string().valid(...Object.values(POLICY_TYPE)).required(),
  content: Joi.string().trim().allow("").default(""),
  isActive: Joi.boolean().default(true),
});

export const getPoliciesQuerySchema = Joi.object({
  storeId: objectId().required(),
});
