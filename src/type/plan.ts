import { Document } from "mongoose";
import { PLAN_DURATION, SUBSCRIPTION_TYPE } from "../common";

export interface IPlanType {
  name: SUBSCRIPTION_TYPE;
  price: number;
  duration: PLAN_DURATION;
  storeLimit: number;
  themeLimit: number;
  productLimit: number;
  blogLimit: number;
  orderLimit: number;
  customDomainSupport: boolean;
  features: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatePlanPayload {
  name: SUBSCRIPTION_TYPE;
  price: number;
  duration: PLAN_DURATION;
  storeLimit: number;
  themeLimit: number;
  productLimit: number;
  blogLimit: number;
  orderLimit: number;
  customDomainSupport: boolean;
  features: string[];
  isActive?: boolean;
}

export interface IUpdatePlanPayload extends Partial<ICreatePlanPayload> { }

export interface IPlan extends Document {
  name: SUBSCRIPTION_TYPE;
  price: number;
  duration: PLAN_DURATION;
  storeLimit: number;
  themeLimit: number;
  productLimit: number;
  blogLimit: number;
  orderLimit: number;
  customDomainSupport: boolean;
  features: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
