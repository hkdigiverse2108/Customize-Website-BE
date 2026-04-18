import { Schema, model } from "mongoose";
import { ICategory } from "../../type";

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

categorySchema.index({ name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
categorySchema.index({ isActive: 1, isDeleted: 1, createdAt: -1 });

export const categoryModel = model<ICategory>("category", categorySchema);
