import { Document, Types } from "mongoose";
import { PAYMENT_FOR, PAYMENT_METHOD, PAYMENT_STATUS } from "../common";

export interface IPaymentType {
  userId: Types.ObjectId | string;
  planId: Types.ObjectId | string | null;
  themeId: Types.ObjectId | string | null;
  orderId: Types.ObjectId | string | null;
  storeId: Types.ObjectId | string | null;
  paymentFor: PAYMENT_FOR;
  amount: number;
  currency: string;
  paymentMethod: PAYMENT_METHOD;
  transactionId: string;
  providerOrderId: string;
  providerResponse?: any;
  status: PAYMENT_STATUS;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatePaymentPayload {
  userId: Types.ObjectId | string;
  planId?: Types.ObjectId | string | null;
  themeId?: Types.ObjectId | string | null;
  orderId?: Types.ObjectId | string | null;
  storeId?: Types.ObjectId | string | null;
  paymentFor?: PAYMENT_FOR;
  amount: number;
  currency: string;
  paymentMethod: PAYMENT_METHOD;
  transactionId: string;
  providerOrderId?: string;
  providerResponse?: any;
  status?: PAYMENT_STATUS;
  paidAt?: Date | null;
}

export interface IUpdatePaymentPayload extends Partial<ICreatePaymentPayload> {}

export interface IPayment extends Document {
  userId: Types.ObjectId | string;
  planId: Types.ObjectId | string | null;
  themeId: Types.ObjectId | string | null;
  orderId: Types.ObjectId | string | null;
  storeId: Types.ObjectId | string | null;
  paymentFor: PAYMENT_FOR;
  amount: number;
  currency: string;
  paymentMethod: PAYMENT_METHOD;
  transactionId: string;
  providerOrderId: string;
  providerResponse?: any;
  status: PAYMENT_STATUS;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
