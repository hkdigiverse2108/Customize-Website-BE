import { Schema, model } from "mongoose";
import { ACCOUNT_TYPE, SUBSCRIPTION_STATUS, SUBSCRIPTION_TYPE } from "../../common";
import { IUser, IUserSubscription } from "../../type";

const subscriptionSchema = new Schema<IUserSubscription>(
  {
    planId: { type: Schema.Types.ObjectId, ref: "plan", default: null },
    type: { type: String, enum: Object.values(SUBSCRIPTION_TYPE), default: SUBSCRIPTION_TYPE.FREE, },
    status: { type: String, enum: Object.values(SUBSCRIPTION_STATUS), default: SUBSCRIPTION_STATUS.ACTIVE, },
    startDate: { type: Date, default: Date.now, },
    endDate: { type: Date, default: null, },
    autoRenew: { type: Boolean, default: false, },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>({
  firstName: { type: String, trim: true, },
  lastName: { type: String, trim: true, },
  email: { type: String, trim: true, },
  password: { type: String, },
  role: { type: String, enum: Object.values(ACCOUNT_TYPE), default: ACCOUNT_TYPE.STORE_OWNER, },
  subscription: { type: subscriptionSchema, default: () => ({ planId: null, type: SUBSCRIPTION_TYPE.FREE, status: SUBSCRIPTION_STATUS.ACTIVE, startDate: new Date(), endDate: null, autoRenew: false, }), },
  otp: { type: Number, default: null },
  otpExpireTime: { type: Date, default: null },
  trialUsed: { type: Boolean, default: false, },
  isActive: { type: Boolean, default: true, },
  isDeleted: { type: Boolean, default: false },
},
  { timestamps: true, versionKey: false, }
);

export const userModel = model<IUser>("user", userSchema);
