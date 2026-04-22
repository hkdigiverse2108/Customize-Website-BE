import { Schema, model } from "mongoose";
import { IDomainSetting } from "../../../type/settings/domainSetting";
import { VERIFICATION_STATUS } from "../../../common";

const domainSettingSchema = new Schema<IDomainSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    themeId: { type: Schema.Types.ObjectId, ref: "theme", default: null },
    domain: { type: String, required: true, trim: true, lowercase: true },
    isPrimary: { type: Boolean, default: false },
    status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: VERIFICATION_STATUS.PENDING },
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
domainSettingSchema.index({ storeId: 1, isPrimary: 1 }, { unique: true, partialFilterExpression: { isDeleted: false, isPrimary: true } });

export const domainSettingModel = model<IDomainSetting>("domainSetting", domainSettingSchema);
