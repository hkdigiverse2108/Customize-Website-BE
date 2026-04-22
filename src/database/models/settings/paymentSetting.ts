import { Schema, model } from "mongoose";
import { IPaymentSetting } from "../../../type/settings/paymentSetting";
import { PAYMENT_METHOD } from "../../../common";

const paymentSettingSchema = new Schema<IPaymentSetting>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "store",
      default: null,
      required: function (this: any) {
        return !this.isGlobal;
      }
    },
    isGlobal: { type: Boolean, default: false },
    razorpayApiKey: { type: String, trim: true, default: "" },
    razorpayApiSecret: { type: String, trim: true, default: "" },
    isRazorpay: { type: Boolean, default: false },
    phonePeApiKey: { type: String, trim: true, default: "" },
    phonePeApiSecret: { type: String, trim: true, default: "" },
    phonePeVersion: { type: String, trim: true, default: "" },
    isPhonePe: { type: Boolean, default: false },
    paymentMethods: { type: [String], enum: Object.values(PAYMENT_METHOD), default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

paymentSettingSchema.index({ isGlobal: 1 }, { unique: true, partialFilterExpression: { isDeleted: false, isGlobal: true } });
paymentSettingSchema.index(
  { storeId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false, isGlobal: { $ne: true }, storeId: { $exists: true, $ne: null } } }
);

export const paymentSettingModel = model<IPaymentSetting>("paymentSetting", paymentSettingSchema);
