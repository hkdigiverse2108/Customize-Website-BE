import { Schema, model } from "mongoose";
import { IStoreSetting } from "../../../type/settings/storeSetting";

const storeSettingSchema = new Schema<IStoreSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    logo: { type: String, trim: true },
    favicon: { type: String, trim: true },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    socialLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      youtube: { type: String, trim: true },
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

// Ensure only one setting document per store
storeSettingSchema.index({ storeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const storeSettingModel = model<IStoreSetting>("storeSetting", storeSettingSchema);
