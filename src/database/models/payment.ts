import { Schema, model } from "mongoose";
import { PAYMENT_FOR, PAYMENT_METHOD, PAYMENT_STATUS } from "../../common";
import { IPayment } from "../../type";

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "plan", default: null },
    themeId: { type: Schema.Types.ObjectId, ref: "theme", default: null },
    orderId: { type: Schema.Types.ObjectId, ref: "order", default: null },
    paymentFor: { type: String, enum: Object.values(PAYMENT_FOR), required: true, default: PAYMENT_FOR.PLAN_SUBSCRIPTION },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true },
    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHOD), required: true },
    transactionId: { type: String, required: true, trim: true },
    providerOrderId: { type: String, default: "", trim: true },
    providerResponse: { type: Schema.Types.Mixed, default: null },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

paymentSchema.pre("validate", function () {
  const hasPlanId = !!this.planId;
  const hasThemeId = !!this.themeId;
  const hasOrderId = !!this.orderId;

  const referenceCount = [hasPlanId, hasThemeId, hasOrderId].filter(Boolean).length;
  if (referenceCount !== 1) throw new Error("Exactly one of planId, themeId or orderId is required.");
  if (hasPlanId) this.paymentFor = PAYMENT_FOR.PLAN_SUBSCRIPTION;
  if (hasThemeId) this.paymentFor = PAYMENT_FOR.THEME_PURCHASE;
  if (hasOrderId) this.paymentFor = PAYMENT_FOR.ORDER_PURCHASE;
});

paymentSchema.index({ transactionId: 1 }, { unique: true });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ planId: 1, createdAt: -1 }, { partialFilterExpression: { planId: { $exists: true, $type: "objectId" } } });
paymentSchema.index({ themeId: 1, createdAt: -1 }, { partialFilterExpression: { themeId: { $exists: true, $type: "objectId" } } });
paymentSchema.index({ orderId: 1, createdAt: -1 }, { partialFilterExpression: { orderId: { $exists: true, $type: "objectId" } } });

export const paymentModel = model<IPayment>("payment", paymentSchema);
