import { Document, Types } from "mongoose";

export type PAGE_TYPE = "home" | "product" | "category" | "custom";
export type PAGE_VISIBILITY = "public" | "private" | "password";

export interface IPageType {
  storeId: Types.ObjectId | string;
  title: string;
  slug: string;
  description: string;
  type: PAGE_TYPE;
  layoutJSON: Record<string, any>;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  isPublished: boolean;
  isHomePage: boolean;
  version: number;
  isDraft: boolean;
  visibility: PAGE_VISIBILITY;
  password: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatePagePayload {
  storeId: Types.ObjectId | string;
  title: string;
  slug: string;
  description?: string;
  type?: PAGE_TYPE;
  layoutJSON: Record<string, any>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  isPublished?: boolean;
  isHomePage?: boolean;
  version?: number;
  isDraft?: boolean;
  visibility?: PAGE_VISIBILITY;
  password?: string;
}

export interface IUpdatePagePayload extends Partial<ICreatePagePayload> {}

export interface IPage extends Document {
  storeId: Types.ObjectId | string;
  title: string;
  slug: string;
  description: string;
  type: PAGE_TYPE;
  layoutJSON: Record<string, any>;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  isPublished: boolean;
  isHomePage: boolean;
  version: number;
  isDraft: boolean;
  visibility: PAGE_VISIBILITY;
  password: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
