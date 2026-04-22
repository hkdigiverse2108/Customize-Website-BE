import { Schema, model } from "mongoose";
import { IPage } from "../../type";
import { PAGE_TYPE, PAGE_VISIBILITY } from "../../common";

const pageSchema = new Schema<IPage>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true },
    type: { type: String, enum: Object.values(PAGE_TYPE), default: PAGE_TYPE.CUSTOM },
    layoutJSON: { type: Schema.Types.Mixed, required: true, default: {} },
    metaTitle: { type: String, default: "", trim: true },
    metaDescription: { type: String, default: "", trim: true },
    metaKeywords: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false },
    isHomePage: { type: Boolean, default: false },
    version: { type: Number, default: 1, min: 1 },
    isDraft: { type: Boolean, default: true },
    visibility: { type: String, enum: Object.values(PAGE_VISIBILITY), default: PAGE_VISIBILITY.PUBLIC },
    password: { type: String, default: "", trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

pageSchema.index({ storeId: 1, slug: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
pageSchema.index(
  { storeId: 1, isHomePage: 1 },
  { unique: true, partialFilterExpression: { isHomePage: true, isDeleted: false } }
);

export const pageModel = model<IPage>("page", pageSchema);
