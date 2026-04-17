import { Document, Types } from "mongoose";

export type SITE_SNAPSHOT_ROUTE_TYPE = "home" | "page";

export interface ISiteSnapshotType {
  storeId: Types.ObjectId | string;
  pageId: Types.ObjectId | string;
  routeType: SITE_SNAPSHOT_ROUTE_TYPE;
  signature: string;
  storeSlug: string;
  pageSlug: string;
  pageVisibility: string;
  payload: Record<string, any>;
  expiresAt: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISiteSnapshot extends Document {
  storeId: Types.ObjectId | string;
  pageId: Types.ObjectId | string;
  routeType: SITE_SNAPSHOT_ROUTE_TYPE;
  signature: string;
  storeSlug: string;
  pageSlug: string;
  pageVisibility: string;
  payload: Record<string, any>;
  expiresAt: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
