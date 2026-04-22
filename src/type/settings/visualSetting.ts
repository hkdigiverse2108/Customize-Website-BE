import { Document, Types } from "mongoose";

export interface IVisualSettingType {
  storeId: Types.ObjectId | string;
  favicon?: string;
  customCSS?: string;
  customJS?: string;
  passwordProtection: {
    enabled: boolean;
    password?: string;
    message?: string;
  };
  checkoutPage: {
    banner?: string;
    logo?: string;
    accentColor?: string;
  };
  isDeleted: boolean;
}

export interface IVisualSetting extends IVisualSettingType, Document {}
