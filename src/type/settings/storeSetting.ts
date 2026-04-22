import { Document, Types } from "mongoose";

export interface IStoreSettingType {
  storeId: Types.ObjectId | string;
  name: string;
  email: string;
  phone: string;
  logo?: string;
  favicon?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  isDeleted: boolean;
}

export interface IStoreSetting extends IStoreSettingType, Document {}
