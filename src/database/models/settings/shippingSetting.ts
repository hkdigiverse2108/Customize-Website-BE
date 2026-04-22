import { Schema, model } from "mongoose";
import { IShippingSetting } from "../../../type/settings/shippingSetting";

const shippingSettingSchema = new Schema<IShippingSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    zoneName: { type: String, required: true, trim: true },
    countries: { type: [String], default: [] },
    rates: [
      {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, default: 0 },
        minOrderValue: { type: Number },
        maxOrderValue: { type: Number },
      },
    ],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

// Multiple zones per store, but zone names should be unique per store
shippingSettingSchema.index({ storeId: 1, zoneName: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const shippingSettingModel = model<IShippingSetting>("shippingSetting", shippingSettingSchema);
