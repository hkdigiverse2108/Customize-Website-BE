import { Document, Types } from "mongoose";

export type BLOG_STATUS = "visible" | "hidden";

export interface IBlogSeoType {
  title: string;
  description: string;
  slug: string;
}

export interface IBlogType {
  storeId: Types.ObjectId | string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  image: string;
  status: BLOG_STATUS;
  tags: string[];
  blogCategory: string; // e.g. "News"
  themeId: Types.ObjectId | string;
  seo: IBlogSeoType;
  isActive: boolean;
  isDeleted: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlog extends Document, IBlogType {}
