import { Schema, model } from "mongoose";
import { ICategory } from "../../type";

const categorySchema = new Schema<ICategory>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    parentCategoryId: { type: Schema.Types.ObjectId, ref: "category", default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

categorySchema.index({ storeId: 1, slug: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const categoryModel = model<ICategory>("category", categorySchema);
