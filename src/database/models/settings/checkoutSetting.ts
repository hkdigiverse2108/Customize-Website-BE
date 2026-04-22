import { Schema, model } from "mongoose";
import { ICheckoutSetting } from "../../../type/settings/checkoutSetting";
import { AUTH_METHOD, SETTING_FIELD_STATUS, VISIBILITY_STATUS } from "../../../common";

const checkoutSettingSchema = new Schema<ICheckoutSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    customerAccounts: { type: String, enum: Object.values(SETTING_FIELD_STATUS), default: SETTING_FIELD_STATUS.OPTIONAL },
    contactMethod: { type: String, enum: Object.values(AUTH_METHOD), default: AUTH_METHOD.EMAIL },
    allowGuestCheckout: { type: Boolean, default: true },
    requirePhoneNumber: { type: Boolean, default: false },
    companyNameField: { type: String, enum: Object.values(VISIBILITY_STATUS), default: VISIBILITY_STATUS.OPTIONAL },
    addressLine2Field: { type: String, enum: Object.values(VISIBILITY_STATUS), default: VISIBILITY_STATUS.OPTIONAL },
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
