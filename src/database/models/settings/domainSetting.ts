import { Schema, model } from "mongoose";
import { IDomainSetting } from "../../../type/settings/domainSetting";

const domainSettingSchema = new Schema<IDomainSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    domain: { type: String, required: true, trim: true, lowercase: true },
    isPrimary: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "verified", "failed"], default: "pending" },
    sslEnabled: { type: Boolean, default: false },
    dnsRecords: [
      {
        type: { type: String, default: "CNAME" },
        host: { type: String, default: "@" },
        value: { type: String },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

// Multiple domains per store, but domain names should be unique globally
domainSettingSchema.index({ domain: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const domainSettingModel = model<IDomainSetting>("domainSetting", domainSettingSchema);
