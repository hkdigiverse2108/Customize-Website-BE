import { Schema, model } from "mongoose";
import { IDiscount } from "../../type";
import { DISCOUNT_APPLIES_TO, DISCOUNT_TYPE } from "../../common";

const discountSchema = new Schema<IDiscount>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true, index: true },
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    type: {
      type: String,
      enum: Object.values(DISCOUNT_TYPE),
      required: true,
    },
    value: { type: Number, default: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, required: true, default: Date.now },
    endsAt: { type: Date, default: null },
    appliesTo: {
      type: String,
      enum: Object.values(DISCOUNT_APPLIES_TO),
      default: DISCOUNT_APPLIES_TO.ALL,
    },
    productIds: [{ type: Schema.Types.ObjectId, ref: "product" }],
    collectionIds: [{ type: Schema.Types.ObjectId, ref: "collection" }],
    customerIds: [{ type: Schema.Types.ObjectId, ref: "user" }],
    prerequisiteProductIds: [{ type: Schema.Types.ObjectId, ref: "product" }],
    prerequisiteQuantity: { type: Number, default: 0 },
    entitledQuantity: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

discountSchema.index({ storeId: 1, code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const discountModel = model<IDiscount>("discount", discountSchema);
