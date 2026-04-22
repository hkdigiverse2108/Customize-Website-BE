import { Document, Types } from "mongoose";

export interface IDomainSettingType {
  storeId: Types.ObjectId | string;
  themeId?: Types.ObjectId | string | null;
  domain: string; // e.g. mystore.com
  isPrimary: boolean;
  status: "pending" | "verified" | "failed";
  sslEnabled: boolean;
  dnsRecords: {
    type: string;
    host: string;
    value: string;
  }[];
  isDeleted: boolean;
}

export interface IDomainSetting extends IDomainSettingType, Document {}
