import { Document, Types } from "mongoose";
import { AUTH_METHOD, SETTING_FIELD_STATUS, VISIBILITY_STATUS } from "../../common";

export interface ICheckoutSettingType {
  storeId: Types.ObjectId | string;
  customerAccounts: SETTING_FIELD_STATUS;
  contactMethod: AUTH_METHOD;
  allowGuestCheckout: boolean;
  requirePhoneNumber: boolean;
  companyNameField: VISIBILITY_STATUS;
  addressLine2Field: VISIBILITY_STATUS;
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
