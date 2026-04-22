import { Schema, model } from "mongoose";
import { INotificationSetting } from "../../../type/settings/notificationSetting";

const togglesSchema = {
  orderPlaced: { type: Boolean, default: true },
  orderCancelled: { type: Boolean, default: true },
  orderShipped: { type: Boolean, default: true },
  paymentSuccess: { type: Boolean, default: true },
  lowStockAlert: { type: Boolean, default: false },
};

const notificationSettingSchema = new Schema<INotificationSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    emailNotifications: togglesSchema,
    smsNotifications: togglesSchema,
    senderEmail: { type: String, trim: true, lowercase: true },
    senderName: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

notificationSettingSchema.index({ storeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const notificationSettingModel = model<INotificationSetting>("notificationSetting", notificationSettingSchema);
