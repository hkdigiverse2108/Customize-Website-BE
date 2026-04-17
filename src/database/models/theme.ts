import { Schema, model } from "mongoose";
import { ITheme } from "../../type";

const supportedPages = ["home", "product", "category", "cart", "checkout", "custom"];

const themeSchema = new Schema<ITheme>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true },
    previewImage: { type: String, default: "", trim: true },
    demoUrl: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true, index: true },
    tags: { type: [String], default: [] },
    isPremium: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 },
    layoutJSON: { type: Schema.Types.Mixed, default: {} },
    supportedComponents: { type: [String], default: [] },
    defaultConfig: {
      colors: { type: Schema.Types.Mixed, default: {} },
      fonts: { type: Schema.Types.Mixed, default: {} },
      spacing: { type: Schema.Types.Mixed, default: {} },
      buttons: { type: Schema.Types.Mixed, default: {} },
    },
    supportedPages: [{ type: String, enum: supportedPages }],
    isResponsive: { type: Boolean, default: true },
    breakpoints: {
      mobile: { type: Number, default: 480 },
      tablet: { type: Number, default: 768 },
      desktop: { type: Number, default: 1024 },
    },
    seoFriendly: { type: Boolean, default: true },
    performanceScore: { type: Number, min: 0, max: 100, default: null },
    lazyLoadEnabled: { type: Boolean, default: true },
    version: { type: String, default: "1.0.0", trim: true },
    changelog: [
      {
        version: { type: String, default: "", trim: true },
        changes: { type: String, default: "", trim: true },
        date: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", default: null },
    authorName: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

themeSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
themeSchema.index({ category: 1, tags: 1 });
themeSchema.index({ isActive: 1, isDeleted: 1, createdAt: -1 });

export const themeModel = model<ITheme>("theme", themeSchema);
