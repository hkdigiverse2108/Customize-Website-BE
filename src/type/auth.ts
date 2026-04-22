import { Types } from "mongoose";
import { ACCOUNT_TYPE } from "../common";
import { IUserSubscriptionType } from "./user";

export interface ISignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: ACCOUNT_TYPE;
  subscription?: IUserSubscriptionType;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IGoogleSignupPayload {
  idToken?: string;
  credential?: string;
}

export interface IForgotPasswordPayload {
  email: string;
}

export interface IResetPasswordPayload {
  email: string;
  otp: number;
  password: string;
}

export interface IChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface IVerifyLoginOtpPayload {
  email: string;
  otp: number;
}

export interface IAuthTokenPayload {
  _id: string;
  email: string;
  role: ACCOUNT_TYPE;
}

export interface IAuthenticatedUser {
  _id: Types.ObjectId | string;
  email?: string;
  role: ACCOUNT_TYPE;
  storeId?: Types.ObjectId | string | null;
}
