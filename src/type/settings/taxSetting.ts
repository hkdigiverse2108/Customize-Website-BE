import { Document, Types } from "mongoose";

export interface ITaxSettingType {
  storeId: Types.ObjectId | string;
  taxEnabled: boolean;
  taxName: string; // e.g. GST, VAT
  taxPercentage: number;
  isTaxIncluded: boolean;
  gstNumber?: string;
  isDeleted: boolean;
}

export interface ITaxSetting extends ITaxSettingType, Document {}
