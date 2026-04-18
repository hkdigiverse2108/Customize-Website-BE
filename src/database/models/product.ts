import { Schema, model } from "mongoose";
import { IProduct } from "../../type";

const productStatuses = ["draft", "active", "archived"];
const productCurrencies = ["INR"];
const productMediaTypes = ["image", "video"];

const productOptionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    values: { type: [String], default: [] },
  },
  { _id: false }
);

const productOptionValueSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productInventorySchema = new Schema(
  {
    quantity: { type: Number, default: 0, min: 0 },
    trackQuantity: { type: Boolean, default: true },
    allowBackorder: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
  },
  { _id: false }
);

const productVariantSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    optionValues: { type: [productOptionValueSchema], default: [] },
    price: { type: Number, default: 0, min: 0 },
    comparePrice: { type: Number, default: 0, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    sku: { type: String, default: "", trim: true },
    barcode: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    inventory: { type: productInventorySchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const productMediaSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: productMediaTypes, default: "image" },
    alt: { type: String, default: "", trim: true },
    position: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const productSeoSchema = new Schema(
  {
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true },
    shortDescription: { type: String, default: "", trim: true },
    status: { type: String, enum: productStatuses, default: "draft", required: true },
    vendor: { type: String, default: "", trim: true },
    productType: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },
    price: { type: Number, default: 0, min: 0 },
    comparePrice: { type: Number, default: 0, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    currency: { type: String, enum: productCurrencies, default: "INR", required: true },
    options: { type: [productOptionSchema], default: [] },
    variants: { type: [productVariantSchema], default: [] },
    hasVariants: { type: Boolean, default: false },
    media: { type: [productMediaSchema], default: [] },
    thumbnail: { type: String, default: "", trim: true },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "category" }],
    collectionIds: [{ type: Schema.Types.ObjectId, ref: "collection" }],
    seo: { type: productSeoSchema, default: () => ({}) },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

productSchema.index({ storeId: 1, slug: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
productSchema.index({ storeId: 1, status: 1, isActive: 1, isDeleted: 1, createdAt: -1 });
productSchema.index({ storeId: 1, vendor: 1 });
productSchema.index({ storeId: 1, productType: 1 });
productSchema.index({ storeId: 1, categoryIds: 1 });
productSchema.index({ storeId: 1, collectionIds: 1 });
productSchema.index({ storeId: 1, tags: 1 });

export const productModel = model<IProduct>("product", productSchema);
