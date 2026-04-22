import { Document, Types } from "mongoose";

export interface ICheckoutSettingType {
  storeId: Types.ObjectId | string;
  customerAccounts: "disabled" | "optional" | "required";
  contactMethod: "email" | "phone_or_email";
  allowGuestCheckout: boolean;
  requirePhoneNumber: boolean;
  companyNameField: "hidden" | "optional" | "required";
  addressLine2Field: "hidden" | "optional" | "required";
  orderProcessing: {
    useShippingAsBillingByDefault: boolean;
    enableAddressAutocompletion: boolean;
  };
  abandonedCart: {
    enabled: boolean;
    sendEmailAfterHours: number;
  };
  isDeleted: boolean;
}

export interface ICheckoutSetting extends ICheckoutSettingType, Document {}
