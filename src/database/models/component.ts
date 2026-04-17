import { Schema, model } from "mongoose";
import { IComponent } from "../../type";

const componentTypes = ["header", "footer", "banner", "productGrid", "custom"];
const componentCategories = ["layout", "marketing", "ecommerce"];
const supportedPages = ["home", "product", "category", "cart", "checkout", "custom"];

const componentSchema = new Schema<IComponent>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", default: null, index: true },
    sourceComponentId: { type: Schema.Types.ObjectId, ref: "component", default: null, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: componentTypes, required: true },
    category: { type: String, enum: componentCategories, default: null },
    label: { type: String, default: "", trim: true },
    icon: { type: String, default: "", trim: true },
    previewImage: { type: String, default: "", trim: true },
    configJSON: { type: Schema.Types.Mixed, default: {} },
    defaultConfig: { type: Schema.Types.Mixed, default: {} },
    configSchema: { type: Schema.Types.Mixed, default: {} },
    isReusable: { type: Boolean, default: true },
    isGlobal: { type: Boolean, default: false },
    supportedPages: [{ type: String, enum: supportedPages }],
    supportedThemes: [{ type: Schema.Types.ObjectId, ref: "theme" }],
    version: { type: String, default: "1.0.0", trim: true },
    isDeprecated: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

componentSchema.index({ type: 1, category: 1 });
componentSchema.index({ storeId: 1, sourceComponentId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false, storeId: { $exists: true, $type: "objectId" }, sourceComponentId: { $exists: true, $type: "objectId" } } });
componentSchema.index({ storeId: 1, name: 1, type: 1, version: 1 }, { unique: true, partialFilterExpression: { isDeleted: false, storeId: { $exists: true, $type: "objectId" } } });
componentSchema.index({ name: 1, type: 1, version: 1 }, { unique: true, partialFilterExpression: { isDeleted: false, $or: [{ storeId: null }, { storeId: { $exists: false } }] } });

export const componentModel = model<IComponent>("component", componentSchema);
