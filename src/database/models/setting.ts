import { Schema, model } from "mongoose";
import { PAYMENT_METHOD } from "../../common";
import { ISetting } from "../../type";

const settingSchema = new Schema<ISetting>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "user", default: null },
    storeId: { type: Schema.Types.ObjectId, ref: "store", default: null },
    logo: { type: String, default: null, trim: true },
    favicon: { type: String, default: null, trim: true },
    brandName: { type: String, default: "", trim: true },
    themeId: { type: String, default: "", trim: true },
    themeConfig: { type: Schema.Types.Mixed, default: {} },
    metaTitle: { type: String, default: "", trim: true },
    metaDescription: { type: String, default: "", trim: true },
    metaKeywords: { type: [String], default: [] },
    currency: { type: String, default: "INR", trim: true },
    timezone: { type: String, default: "Asia/Kolkata", trim: true },
    contactEmail: { type: String, default: "", trim: true, lowercase: true },
    contactPhone: { type: String, default: "", trim: true },
    taxEnabled: { type: Boolean, default: false },
    gstNumber: { type: String, default: "", trim: true },
    shippingEnabled: { type: Boolean, default: false },
    paymentMethods: { type: [String], enum: Object.values(PAYMENT_METHOD), default: [] },
    razorpayApiKey: { type: String, default: "", trim: true },
    razorpayApiSecret: { type: String, default: "", trim: true },
    isRazorpay: { type: Boolean, default: false },
    phonePeApiKey: { type: String, default: "", trim: true },
    phonePeApiSecret: { type: String, default: "", trim: true },
    phonePeVersion: { type: String, default: "", trim: true },
    isPhonePe: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

settingSchema.pre("validate", function () {
  const hasUserId = !!this.userId;
  const hasStoreId = !!this.storeId;

  if (hasUserId === hasStoreId) { throw new Error("Exactly one of userId or storeId is required."); }
});

settingSchema.index({ storeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false, storeId: { $exists: true, $type: "objectId" }, }, });
settingSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false, userId: { $exists: true, $type: "objectId" }, }, });

export const settingModel = model<ISetting>("setting", settingSchema);
