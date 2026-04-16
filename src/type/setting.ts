import { Document, Types } from "mongoose";
import { PAYMENT_METHOD } from "../common";

export interface IThemeConfig {
  colors?: Record<string, any>;
  fonts?: Record<string, any>;
  layout?: Record<string, any>;
  [key: string]: any;
}

export interface ISettingType {
  userId: Types.ObjectId | string | null;
  storeId: Types.ObjectId | string | null;
  logo: string | null;
  favicon: string | null;
  brandName: string;
  themeId: string;
  themeConfig: IThemeConfig;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  currency: string;
  timezone: string;
  contactEmail: string;
  contactPhone: string;
  taxEnabled: boolean;
  gstNumber: string;
  shippingEnabled: boolean;
  paymentMethods: PAYMENT_METHOD[];
  razorpayApiKey: string;
  razorpayApiSecret: string;
  isRazorpay: boolean;
  phonePeApiKey: string;
  phonePeApiSecret: string;
  phonePeVersion: string;
  isPhonePe: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUpsertStoreSettingPayload {
  storeId: Types.ObjectId | string;
  logo?: string | null;
  favicon?: string | null;
  brandName?: string;
  themeId?: string;
  themeConfig?: IThemeConfig;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  currency?: string;
  timezone?: string;
  contactEmail?: string;
  contactPhone?: string;
  taxEnabled?: boolean;
  gstNumber?: string;
  shippingEnabled?: boolean;
  paymentMethods?: PAYMENT_METHOD[];
  razorpayApiKey?: string;
  razorpayApiSecret?: string;
  isRazorpay?: boolean;
  phonePeApiKey?: string;
  phonePeApiSecret?: string;
  phonePeVersion?: string;
  isPhonePe?: boolean;
}

export interface IUpsertAdminSettingPayload {
  paymentMethods: PAYMENT_METHOD[];
  razorpayApiKey?: string;
  razorpayApiSecret?: string;
  isRazorpay?: boolean;
  phonePeApiKey?: string;
  phonePeApiSecret?: string;
  phonePeVersion?: string;
  isPhonePe?: boolean;
}

export interface ISetting extends Document {
  userId: Types.ObjectId | string | null;
  storeId: Types.ObjectId | string | null;
  logo: string | null;
  favicon: string | null;
  brandName: string;
  themeId: string;
  themeConfig: IThemeConfig;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  currency: string;
  timezone: string;
  contactEmail: string;
  contactPhone: string;
  taxEnabled: boolean;
  gstNumber: string;
  shippingEnabled: boolean;
  paymentMethods: PAYMENT_METHOD[];
  razorpayApiKey: string;
  razorpayApiSecret: string;
  isRazorpay: boolean;
  phonePeApiKey: string;
  phonePeApiSecret: string;
  phonePeVersion: string;
  isPhonePe: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
