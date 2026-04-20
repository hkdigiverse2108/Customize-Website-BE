import { Document, Types } from "mongoose";

export interface ICategoryType {
  storeId: Types.ObjectId | string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentCategoryId: Types.ObjectId | string | null;
  isActive: boolean;
  isDeleted: boolean;
}

export interface ICategory extends Document, ICategoryType {}
