import { Schema, model } from "mongoose";
import { ICollection } from "../../type";

const collectionTypes = ["manual", "smart"];
const collectionStatuses = ["draft", "active", "archived"];
const collectionRuleConditions = ["AND", "OR"];
const collectionRuleFields = ["price", "tag", "title", "vendor", "productType"];
const collectionOperators = ["equals", "not_equals", "contains", "greater_than", "less_than"];
const collectionSortOrders = [
  "manual",
  "best-selling",
  "price-ascending",
  "price-descending",
  "title-ascending",
  "title-descending",
  "created-desc",
  "created-asc",
];

const collectionRuleSchema = new Schema(
  {
    field: { type: String, required: true, enum: collectionRuleFields, trim: true },
    operator: { type: String, required: true, enum: collectionOperators, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const collectionImageSchema = new Schema(
  {
    url: { type: String, default: "", trim: true },
    alt: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const collectionSeoSchema = new Schema(
  {
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const collectionSchema = new Schema<ICollection>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true, index: true },
    title: { type: String, required: true, trim: true },
    handle: { type: String, required: true, trim: true, lowercase: true },
    type: { type: String, enum: collectionTypes, default: "manual", required: true },
    status: { type: String, enum: collectionStatuses, default: "draft", required: true },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    description: { type: String, default: "", trim: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: "product" }],
    rules: { type: [collectionRuleSchema], default: [] },
    ruleCondition: { type: String, enum: collectionRuleConditions, default: "AND" },
    sortOrder: { type: String, enum: collectionSortOrders, default: "manual" },
    image: { type: collectionImageSchema, default: () => ({}) },
    seo: { type: collectionSeoSchema, default: () => ({}) },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

collectionSchema.index({ storeId: 1, handle: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
collectionSchema.index({ storeId: 1, type: 1, status: 1, isPublished: 1, createdAt: -1 });
collectionSchema.index({ storeId: 1, productIds: 1 });
collectionSchema.index({ storeId: 1, tags: 1 });
collectionSchema.index({ storeId: 1, isActive: 1, isDeleted: 1, createdAt: -1 });

export const collectionModel = model<ICollection>("collection", collectionSchema);
