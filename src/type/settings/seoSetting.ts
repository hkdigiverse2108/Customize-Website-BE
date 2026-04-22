import { Document, Types } from "mongoose";

export interface ISEOSettingType {
  storeId: Types.ObjectId | string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  isDeleted: boolean;
}

export interface ISEOSetting extends ISEOSettingType, Document {}
