import { Document, Types } from "mongoose";

export interface INotificationEventToggles {
  orderPlaced: boolean;
  orderCancelled: boolean;
  orderShipped: boolean;
  paymentSuccess: boolean;
  lowStockAlert: boolean;
}

export interface INotificationSettingType {
  storeId: Types.ObjectId | string;
  emailNotifications: INotificationEventToggles;
  smsNotifications: INotificationEventToggles;
  senderEmail?: string;
  senderName?: string;
  isDeleted: boolean;
}

export interface INotificationSetting extends INotificationSettingType, Document {}
