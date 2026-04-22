import { Document, Types } from "mongoose";
import { POLICY_TYPE } from "../common";

export interface IPolicyType {
  storeId: Types.ObjectId | string;
  type: POLICY_TYPE;
  content: string;
  isActive: boolean;
  isDeleted: boolean;
}

export interface IPolicy extends IPolicyType, Document {}

export interface IAddOrEditPolicyPayload {
  storeId: Types.ObjectId | string;
  type: POLICY_TYPE;
  content: string;
  isActive?: boolean;
}
