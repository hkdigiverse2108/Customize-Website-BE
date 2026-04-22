import { Document, Types } from "mongoose";

export interface IMailSettingType {
  storeId: Types.ObjectId | string;
  provider: "gmail" | "smtp" | "resend" | "sendgrid";
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
