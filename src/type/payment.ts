import { Document, Types } from "mongoose";
import { PAYMENT_METHOD, PAYMENT_STATUS } from "../common";

export interface IPaymentType {
  userId: Types.ObjectId | string;
  amount: number;
  currency: string;
  paymentMethod: PAYMENT_METHOD;
  transactionId: string;
  status: PAYMENT_STATUS;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatePaymentPayload {
  userId: Types.ObjectId | string;
  amount: number;
  currency: string;
  paymentMethod: PAYMENT_METHOD;
  transactionId: string;
  status?: PAYMENT_STATUS;
  paidAt?: Date | null;
}

export interface IUpdatePaymentPayload extends Partial<ICreatePaymentPayload> {}

export interface IPayment extends Document {
  userId: Types.ObjectId | string;
  amount: number;
  currency: string;
  paymentMethod: PAYMENT_METHOD;
  transactionId: string;
  status: PAYMENT_STATUS;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
