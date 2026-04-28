import { Schema, model } from "mongoose";
import { ITheme, THEME_SUPPORTED_PAGES, THEME_TYPES } from "../../type/theme";

const themeStylesSchema = new Schema(
  {
    colors: {
      primary: { type: String, default: "" },
      secondary: { type: String, default: "" },
      background: { type: String, default: "" },
      text: { type: String, default: "" },
    },
    fonts: {
      heading: { type: String, default: "" },
      body: { type: String, default: "" },
    },
    layout: {
      containerWidth: { type: String, enum: ["full", "boxed"], default: "full" },
      spacing: { type: String, default: "" },
    },
  },
  { _id: false }
);

const themeBreakpointsSchema = new Schema(
  {
    mobile: { type: Number, min: 0 },
    tablet: { type: Number, min: 0 },
    desktop: { type: Number, min: 0 },
  },
  { _id: false }
);

const themeChangelogSchema = new Schema(
  {
    version: { type: String, trim: true, default: "" },
    changes: { type: String, trim: true, default: "" },
    date: { type: Date, default: null },
  },
  { _id: false }
);

const themeSchema = new Schema<ITheme>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true },
    demoUrl: { type: String, default: "", trim: true },
    previewImage: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },
    type: { type: String, enum: THEME_TYPES, default: "free", trim: true, lowercase: true },
    isPremium: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 },
    storeId: { type: Schema.Types.ObjectId, ref: "store", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "user", default: null },
    isGlobal: { type: Boolean, default: true }, // Admin theme
    styles: { type: themeStylesSchema, default: () => ({}) },
    layoutJSON: { type: Schema.Types.Mixed, default: {} },
    draftLayoutJSON: { type: Schema.Types.Mixed, default: {} },
    defaultConfig: { type: Schema.Types.Mixed, default: {} },
    supportedComponents: { type: [String], default: [] },
    supportedPages: { type: [{ type: String, enum: THEME_SUPPORTED_PAGES }], default: [] },
    isResponsive: { type: Boolean, default: false },
    breakpoints: { type: themeBreakpointsSchema, default: () => ({}) },
    seoFriendly: { type: Boolean, default: false },
    performanceScore: { type: Number, default: null, min: 0, max: 100 },
    lazyLoadEnabled: { type: Boolean, default: false },
    version: { type: String, default: "1.0.0", trim: true },
    changelog: { type: [themeChangelogSchema], default: [] },
    authorName: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

themeSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
themeSchema.index({ storeId: 1, isDeleted: 1 });
themeSchema.index({ createdBy: 1, isDeleted: 1 });
themeSchema.index({ supportedPages: 1, isDeleted: 1 });
themeSchema.index({ type: 1, isDeleted: 1 });
themeSchema.index({ isPremium: 1, isDeleted: 1 });

export const themeModel = model<ITheme>("theme", themeSchema);
