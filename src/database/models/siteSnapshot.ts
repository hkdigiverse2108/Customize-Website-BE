import { Schema, model } from "mongoose";
import { ISiteSnapshot } from "../../type";

const routeTypes = ["home", "page"];

const siteSnapshotSchema = new Schema<ISiteSnapshot>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true, index: true },
    pageId: { type: Schema.Types.ObjectId, ref: "page", required: true, index: true },
    routeType: { type: String, enum: routeTypes, required: true, trim: true },
    signature: { type: String, required: true, trim: true, index: true },
    storeSlug: { type: String, default: "", trim: true, lowercase: true },
    pageSlug: { type: String, default: "", trim: true, lowercase: true },
    pageVisibility: { type: String, default: "public", trim: true, lowercase: true },
    payload: { type: Schema.Types.Mixed, required: true, default: {} },
    expiresAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

siteSnapshotSchema.index(
  { storeId: 1, pageId: 1, routeType: 1, signature: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
siteSnapshotSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
siteSnapshotSchema.index({ storeSlug: 1, pageSlug: 1, routeType: 1, expiresAt: -1 });

export const siteSnapshotModel = model<ISiteSnapshot>("siteSnapshot", siteSnapshotSchema);
