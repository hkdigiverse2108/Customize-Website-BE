import { Document, Types } from "mongoose";
import { VERIFICATION_STATUS } from "../../common";

export interface IDomainSettingType {
  storeId: Types.ObjectId | string;
  themeId?: Types.ObjectId | string | null;
  domain: string; // e.g. mystore.com
  isPrimary: boolean;
  status: VERIFICATION_STATUS;
  sslEnabled: boolean;
  dnsRecords: {
    type: string;
    host: string;
    value: string;
  }[];
  isDeleted: boolean;
}

export interface IDomainSetting extends IDomainSettingType, Document {}
