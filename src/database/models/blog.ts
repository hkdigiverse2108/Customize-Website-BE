import { Schema, model } from "mongoose";
import { IBlog } from "../../type";

const blogSeoSchema = new Schema(
  {
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false }
);

const blogSchema = new Schema<IBlog>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "", trim: true },
    excerpt: { type: String, default: "", trim: true },
    author: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    status: { type: String, enum: ["visible", "hidden"], default: "visible" },
    tags: { type: [String], default: [] },
    blogCategory: { type: String, default: "News", trim: true },
    themeId: { type: Schema.Types.ObjectId, ref: "theme", default: null },
    seo: { type: blogSeoSchema, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// Indexes
blogSchema.index({ storeId: 1, "seo.slug": 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
blogSchema.index({ storeId: 1, status: 1, isActive: 1 });

export const blogModel = model<IBlog>("blog", blogSchema);
