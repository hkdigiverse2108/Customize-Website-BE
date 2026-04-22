import { Document, Types } from "mongoose";

export interface IRegionSettingType {
  storeId: Types.ObjectId | string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  unitSystem: "metric" | "imperial";
  weightUnit: string;
  lengthUnit: string;
  isDeleted: boolean;
}

export interface IRegionSetting extends IRegionSettingType, Document {}
