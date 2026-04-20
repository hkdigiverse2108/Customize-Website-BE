import { Schema, model, Document, Types } from "mongoose";

export interface IWebhook extends Document {
  storeId: Types.ObjectId | string;
  topic: string; // e.g., 'product.created', 'order.placed'
  targetUrl: string;
  secret: string; // For HMAC verification
  isActive: boolean;
  isDeleted: boolean;
}

const webhookSchema = new Schema<IWebhook>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    topic: { type: String, required: true },
    targetUrl: { type: String, required: true, trim: true },
    secret: { type: String, required: true }, // Used to sign the payload
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

webhookSchema.index({ storeId: 1, topic: 1 });

export const webhookModel = model<IWebhook>("webhook", webhookSchema);
