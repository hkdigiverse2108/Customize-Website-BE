import { Document, Types } from "mongoose";

export type COMPONENT_TYPE = "header" | "footer" | "banner" | "productGrid" | "custom";
export type COMPONENT_CATEGORY = "layout" | "marketing" | "ecommerce";
export type COMPONENT_SUPPORTED_PAGE = "home" | "product" | "category" | "cart" | "checkout" | "custom";

export interface IComponentType {
  storeId: Types.ObjectId | string | null;
  sourceComponentId: Types.ObjectId | string | null;
  name: string;
  type: COMPONENT_TYPE;
  category: COMPONENT_CATEGORY | null;
  label: string;
  icon: string;
  previewImage: string;
  configJSON: Record<string, any>;
  defaultConfig: Record<string, any>;
  configSchema: Record<string, any>;
  isReusable: boolean;
  isGlobal: boolean;
  supportedPages: COMPONENT_SUPPORTED_PAGE[];
  supportedThemes: (Types.ObjectId | string)[];
  version: string;
  isDeprecated: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateComponentPayload {
  storeId?: Types.ObjectId | string | null;
  sourceComponentId?: Types.ObjectId | string | null;
  name: string;
  type: COMPONENT_TYPE;
  category?: COMPONENT_CATEGORY | null;
  label?: string;
  icon?: string;
  previewImage?: string;
  configJSON?: Record<string, any>;
  defaultConfig?: Record<string, any>;
  configSchema?: Record<string, any>;
  isReusable?: boolean;
  isGlobal?: boolean;
  supportedPages?: COMPONENT_SUPPORTED_PAGE[];
  supportedThemes?: (Types.ObjectId | string)[];
  version?: string;
  isDeprecated?: boolean;
  isActive?: boolean;
}

export interface IUpdateComponentPayload extends Partial<ICreateComponentPayload> {}

export interface IComponent extends Document {
  storeId: Types.ObjectId | string | null;
  sourceComponentId: Types.ObjectId | string | null;
  name: string;
  type: COMPONENT_TYPE;
  category: COMPONENT_CATEGORY | null;
  label: string;
  icon: string;
  previewImage: string;
  configJSON: Record<string, any>;
  defaultConfig: Record<string, any>;
  configSchema: Record<string, any>;
  isReusable: boolean;
  isGlobal: boolean;
  supportedPages: COMPONENT_SUPPORTED_PAGE[];
  supportedThemes: (Types.ObjectId | string)[];
  version: string;
  isDeprecated: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
