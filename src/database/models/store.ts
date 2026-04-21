import { Schema, model } from "mongoose";
import { KYC_DOCUMENT_TYPE, KYC_STATUS } from "../../common";
import { IStore } from "../../type";

const storeKycDocumentSchema = new Schema(
  { type: { type: String, enum: Object.values(KYC_DOCUMENT_TYPE), required: true }, documentUrl: { type: String, required: true, trim: true }, verified: { type: Boolean, default: false }, },
  { _id: false }
);

const storeAddressSchema = new Schema(
  {
    country: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    pincode: { type: String, default: "", trim: true },
    addressLine1: { type: String, default: "", trim: true },
    addressLine2: { type: String, default: "", trim: true },
    landmark: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const storeSchema = new Schema<IStore>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true },
    logo: { type: String, default: null, trim: true },
    banner: { type: String, default: null, trim: true },
    themeIds: [{ type: Schema.Types.ObjectId, ref: "theme", required: true, default: [] }],
    themeConfig: {
      colors: { type: Schema.Types.Mixed, default: {} },
      fonts: { type: Schema.Types.Mixed, default: {} },
      spacing: { type: Schema.Types.Mixed, default: {} },
    },
    userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    subdomain: { type: String, required: true, trim: true, lowercase: true },
    customDomain: { type: String, default: null, trim: true, lowercase: true },
    domainVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    businessName: { type: String, required: true, trim: true },
    businessType: { type: String, required: true, trim: true },
    gstNumber: { type: String, default: "", trim: true },
    panNumber: { type: String, default: "", trim: true, uppercase: true },
    kycStatus: { type: String, enum: Object.values(KYC_STATUS), default: KYC_STATUS.PENDING },
    kycDocuments: { type: [storeKycDocumentSchema], default: [] },
    address: { type: storeAddressSchema, default: () => ({}) },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    totalProducts: { type: Number, default: 0, min: 0 },
    totalOrders: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    
    // 🌐 Ecosystem & Marketing (Shopify style)
    externalScripts: [{
      name: String,
      src: String,
      position: { type: String, enum: ['head', 'body_start', 'body_end'], default: 'head' },
      isActive: { type: Boolean, default: true }
    }],
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String,
      linkedin: String
    },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

storeSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
storeSchema.index({ subdomain: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
storeSchema.index({ panNumber: 1 }, { unique: true, partialFilterExpression: { isDeleted: false, panNumber: { $exists: true, $type: "string", $nin: [""] }, }, });
storeSchema.index({ customDomain: 1 }, { unique: true, partialFilterExpression: { isDeleted: false, customDomain: { $exists: true, $type: "string", $nin: [""] }, }, });
storeSchema.index({ userId: 1, createdAt: -1 });

export const storeModel = model<IStore>("store", storeSchema);
