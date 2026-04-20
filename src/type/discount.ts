import { Document, Types } from "mongoose";
import { DISCOUNT_APPLIES_TO, DISCOUNT_TYPE } from "../common";

export interface IDiscountType {
  storeId: Types.ObjectId | string;
  title: string;
  code: string;
  type: DISCOUNT_TYPE;
  value: number; // Percentage off, or fixed amount off, or 0 for free shipping
  minOrderValue: number;
  maxDiscountAmount: number; // Cap for percentage discounts
  usageLimit: number | null; // Null means unlimited
  usedCount: number;
  isActive: boolean;
  startsAt: Date;
  endsAt: Date | null;
  appliesTo: DISCOUNT_APPLIES_TO;
  
  productIds: Types.ObjectId[] | string[];
  collectionIds: Types.ObjectId[] | string[];
  customerIds: Types.ObjectId[] | string[]; // VIP customers limitation

  // For Buy X Get Y specific rules
  prerequisiteProductIds: Types.ObjectId[] | string[];
  prerequisiteQuantity: number;
  entitledQuantity: number;
  
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDiscount extends Document, IDiscountType {}

export interface ICreateDiscountPayload extends Omit<IDiscountType, "usedCount" | "isDeleted" | "createdAt" | "updatedAt"> {}
export interface IUpdateDiscountPayload extends Partial<ICreateDiscountPayload> {}
