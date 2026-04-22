import { Schema, model } from "mongoose";

const userLimitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "user", required: true, unique: true },
    
    // Total combined limits (Base Plan + Any Additive Roll-overs)
    limits: {
      themes: { type: Number, default: 1 },
      products: { type: Number, default: 10 },
      blogs: { type: Number, default: 5 },
      orders: { type: Number, default: 50 },
      customDomainSupport: { type: Boolean, default: false },
    },

    // Real-time usage tracking
    usage: {
      themes: { type: Number, default: 0 },
      products: { type: Number, default: 0 },
      blogs: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
    },

    lastSyncAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

export const userLimitModel = model("userLimit", userLimitSchema);
