import { Document } from "mongoose";

export interface ICategoryType {
  name: string;
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateCategoryPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface IUpdateCategoryPayload extends Partial<ICreateCategoryPayload> {}

export interface ICategory extends Document {
  name: string;
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
