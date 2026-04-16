import { Schema, model } from "mongoose";
import { PAYMENT_METHOD, PAYMENT_STATUS } from "../../common";
import { IPayment } from "../../type";

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true },
    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHOD), required: true },
    transactionId: { type: String, required: true, trim: true },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

paymentSchema.index({ transactionId: 1 }, { unique: true });
paymentSchema.index({ userId: 1, createdAt: -1 });

export const paymentModel = model<IPayment>("payment", paymentSchema);
