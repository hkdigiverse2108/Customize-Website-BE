import { Document, Types } from "mongoose";

export type PRODUCT_STATUS = "draft" | "active" | "archived";
export type PRODUCT_CURRENCY = "INR";
export type PRODUCT_MEDIA_TYPE = "image" | "video";

export interface IProductOptionType {
  name: string;
  values: string[];
}

export interface IProductOptionValueType {
  name: string;
  value: string;
}

export interface IProductInventoryType {
  quantity: number;
  trackQuantity: boolean;
  allowBackorder: boolean;
  lowStockThreshold: number;
}

export interface IProductVariantType {
  title: string;
  optionValues: IProductOptionValueType[];
  price: number;
  comparePrice: number;
  costPrice: number;
  sku: string;
  barcode: string;
  image: string;
  inventory: IProductInventoryType;
  isActive: boolean;
}

export interface IProductMediaType {
  url: string;
  type: PRODUCT_MEDIA_TYPE;
  alt: string;
  position: number;
}

export interface IProductSeoType {
  title: string;
  description: string;
}

export interface IProductType {
  storeId: Types.ObjectId | string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  status: PRODUCT_STATUS;
  vendor: string;
  productType: string;
  tags: string[];
  price: number;
  comparePrice: number;
  costPrice: number;
  currency: PRODUCT_CURRENCY;
  options: IProductOptionType[];
  variants: IProductVariantType[];
  hasVariants: boolean;
  media: IProductMediaType[];
  thumbnail: string;
  categoryIds: (Types.ObjectId | string)[];
  collectionIds: (Types.ObjectId | string)[];
  seo: IProductSeoType;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isDeleted: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateProductPayload {
  storeId: Types.ObjectId | string;
  title: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  status?: PRODUCT_STATUS;
  vendor?: string;
  productType?: string;
  tags?: string[];
  price?: number;
  comparePrice?: number;
  costPrice?: number;
  currency?: PRODUCT_CURRENCY;
  options?: IProductOptionType[];
  variants?: IProductVariantType[];
  hasVariants?: boolean;
  media?: IProductMediaType[];
  thumbnail?: string;
  categoryIds?: (Types.ObjectId | string)[];
  collectionIds?: (Types.ObjectId | string)[];
  seo?: Partial<IProductSeoType>;
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  publishedAt?: Date | string | null;
}

export interface IUpdateProductPayload extends Partial<ICreateProductPayload> {}

export interface IProduct extends Document {
  storeId: Types.ObjectId | string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  status: PRODUCT_STATUS;
  vendor: string;
  productType: string;
  tags: string[];
  price: number;
  comparePrice: number;
  costPrice: number;
  currency: PRODUCT_CURRENCY;
  options: IProductOptionType[];
  variants: IProductVariantType[];
  hasVariants: boolean;
  media: IProductMediaType[];
  thumbnail: string;
  categoryIds: (Types.ObjectId | string)[];
  collectionIds: (Types.ObjectId | string)[];
  seo: IProductSeoType;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isDeleted: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
