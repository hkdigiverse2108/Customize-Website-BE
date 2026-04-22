import { Document, Types } from "mongoose";
import { COMPONENT_TYPE, COMPONENT_CATEGORY, SUPPORTED_PAGE } from "../common";

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
  draftConfigJSON: Record<string, any> | null;
  defaultConfig: Record<string, any>;
  configSchema: Record<string, any>;
  isReusable: boolean;
  isGlobal: boolean;
  isPublished: boolean;
  supportedPages: SUPPORTED_PAGE[];
  supportedThemes: (Types.ObjectId | string)[];
  version: string;
  isDeprecated: boolean;
  isReadOnly: boolean;
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
  draftConfigJSON?: Record<string, any> | null;
  defaultConfig?: Record<string, any>;
  configSchema?: Record<string, any>;
  isReusable?: boolean;
  isGlobal?: boolean;
  isPublished?: boolean;
  supportedPages?: SUPPORTED_PAGE[];
  supportedThemes?: (Types.ObjectId | string)[];
  version?: string;
  isDeprecated?: boolean;
  isReadOnly?: boolean;
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
  draftConfigJSON: Record<string, any> | null;
  defaultConfig: Record<string, any>;
  configSchema: Record<string, any>;
  isReusable: boolean;
  isGlobal: boolean;
  isPublished: boolean;
  supportedPages: SUPPORTED_PAGE[];
  supportedThemes: (Types.ObjectId | string)[];
  version: string;
  isDeprecated: boolean;
  isReadOnly: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
