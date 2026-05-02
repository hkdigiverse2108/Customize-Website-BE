import { Schema, model } from "mongoose";
import { ITheme, THEME_SUPPORTED_PAGES, THEME_TYPES } from "../../type/theme";
import { THEME_SETTING_TYPE, THEME_SETTING_GROUP } from "../../common/enum";


export const themeSettingItemSchema = new Schema(
  {
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, default: null },
    type: { type: String, enum: Object.values(THEME_SETTING_TYPE), default: THEME_SETTING_TYPE.TEXT },
    label: { type: String, default: "" },
    group: { type: String, enum: Object.values(THEME_SETTING_GROUP), default: THEME_SETTING_GROUP.GENERAL },
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

export const themeSchemaItemSchema = new Schema(
  {
    key: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, default: "" },
    default: { type: Schema.Types.Mixed, default: null },
    options: { type: [Schema.Types.Mixed], default: [] },
    group: { type: String, default: "" },
    placeholder: { type: String, default: "" },
    validation: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);


export const themePageLayoutSchema = new Schema(

  {
    page: { type: String, required: true },
    sections: {
      type: [
        {
          componentId: { type: Schema.Types.ObjectId, ref: "component", required: true },
          order: { type: Number, default: 0 },
          config: { type: [themeSettingItemSchema], default: [] },
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const themeBreakpointsSchema = new Schema(
  {
    mobile: { type: Number, default: 320 },
    tablet: { type: Number, default: 768 },
    desktop: { type: Number, default: 1024 },
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
    isGlobal: { type: Boolean, default: true }, 
    styles: { type: [themeSettingItemSchema], default: [] },
    layoutJSON: { type: [themePageLayoutSchema], default: [] },
    draftLayoutJSON: { type: [themePageLayoutSchema], default: [] },
    componentSchema: { type: [themeSchemaItemSchema], default: [] },
    settingsSchema: { type: [themeSchemaItemSchema], default: [] },
    defaultConfig: { type: [themeSettingItemSchema], default: [] },
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
