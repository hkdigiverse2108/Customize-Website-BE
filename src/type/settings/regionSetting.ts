import { Document, Types } from "mongoose";
import { MEASUREMENT_SYSTEM } from "../../common";

export interface IRegionSettingType {
  storeId: Types.ObjectId | string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  unitSystem: MEASUREMENT_SYSTEM;
  weightUnit: string;
  lengthUnit: string;
  isDeleted: boolean;
}

export interface IRegionSetting extends IRegionSettingType, Document {}
