import { Document, Types } from "mongoose";
import { EMAIL_PROVIDER } from "../../common";

export interface IMailSettingType {
  storeId: Types.ObjectId | string;
  provider: EMAIL_PROVIDER;
  host?: string;
  port?: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
  isDeleted: boolean;
}

export interface IMailSetting extends IMailSettingType, Document {}
