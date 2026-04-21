import { Document, Types } from "mongoose";
import { ACCOUNT_TYPE, SUBSCRIPTION_STATUS, SUBSCRIPTION_TYPE } from "../common";

export interface IUserSubscriptionType {
  planId: Types.ObjectId | string | null;
  type: SUBSCRIPTION_TYPE;
  status: SUBSCRIPTION_STATUS;
  startDate: Date;
  endDate: Date | null;
  autoRenew: boolean;
}

export interface IUserType {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: ACCOUNT_TYPE;
  storeId?: Types.ObjectId | string | null;
  subscription: IUserSubscriptionType;
  otp: number | null;
  otpExpireTime: Date | null;
  trialUsed: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: ACCOUNT_TYPE;
  storeId?: Types.ObjectId | string | null;
  subscription?: IUserSubscriptionType;
  trialUsed?: boolean;
  isActive?: boolean;
}

export interface IUserSubscription {
  planId: Types.ObjectId | string | null;
  type: SUBSCRIPTION_TYPE;
  status: SUBSCRIPTION_STATUS;
  startDate: Date;
  endDate: Date | null;
  autoRenew: boolean;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: ACCOUNT_TYPE;
  storeId?: Types.ObjectId | string | null;
  subscription: IUserSubscription;
  otp: number | null;
  otpExpireTime: Date | null;
  trialUsed: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUpdateUserPayload extends Partial<ICreateUserPayload> { }
