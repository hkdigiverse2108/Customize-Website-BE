import { Schema, model } from "mongoose";
import { IMailSetting } from "../../../type/settings/mailSetting";

const mailSettingSchema = new Schema<IMailSetting>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true },
    provider: { type: String, enum: ["gmail", "smtp", "resend", "sendgrid"], default: "smtp" },
    host: { type: String, trim: true },
    port: { type: Number },
    secure: { type: Boolean, default: true },
    auth: {
      user: { type: String, trim: true },
      pass: { type: String, trim: true },
    },
    fromEmail: { type: String, trim: true, lowercase: true },
    fromName: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

mailSettingSchema.index({ storeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const mailSettingModel = model<IMailSetting>("mailSetting", mailSettingSchema);
