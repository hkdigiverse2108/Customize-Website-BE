import { Document, Types } from "mongoose";
import { PAYMENT_METHOD } from "../../common";

export interface IPaymentSettingType {
  storeId: Types.ObjectId | string;
  razorpayApiKey?: string;
  razorpayApiSecret?: string;
  isRazorpay: boolean;
  phonePeApiKey?: string;
  phonePeApiSecret?: string;
  phonePeVersion?: string;
  isPhonePe: boolean;
  paymentMethods: PAYMENT_METHOD[];
  isDeleted: boolean;
}

export interface IPaymentSetting extends IPaymentSettingType, Document {}
