import { Document, Types } from "mongoose";

export interface IShippingRate {
  name: string;
  price: number;
  minOrderValue?: number;
  maxOrderValue?: number;
}

export interface IShippingSettingType {
  storeId: Types.ObjectId | string;
  zoneName: string;
  countries: string[];
  rates: IShippingRate[];
  isActive: boolean;
  isDeleted: boolean;
}

export interface IShippingSetting extends IShippingSettingType, Document {}
