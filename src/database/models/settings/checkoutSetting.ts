import { Schema, model } from "mongoose";
import { ICheckoutSetting } from "../../../type/settings/checkoutSetting";

const checkoutSettingSchema = new Schema<ICheckoutSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    customerAccounts: { type: String, enum: ["disabled", "optional", "required"], default: "optional" },
    contactMethod: { type: String, enum: ["email", "phone_or_email"], default: "email" },
    allowGuestCheckout: { type: Boolean, default: true },
    requirePhoneNumber: { type: Boolean, default: false },
    companyNameField: { type: String, enum: ["hidden", "optional", "required"], default: "optional" },
    addressLine2Field: { type: String, enum: ["hidden", "optional", "required"], default: "optional" },
    orderProcessing: {
      useShippingAsBillingByDefault: { type: Boolean, default: true },
      enableAddressAutocompletion: { type: Boolean, default: false },
    },
    abandonedCart: {
      enabled: { type: Boolean, default: false },
      sendEmailAfterHours: { type: Number, default: 10 },
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

checkoutSettingSchema.index({ storeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const checkoutSettingModel = model<ICheckoutSetting>("checkoutSetting", checkoutSettingSchema);
