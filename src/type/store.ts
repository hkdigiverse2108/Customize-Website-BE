import { Document, Types } from "mongoose";
import { KYC_DOCUMENT_TYPE, KYC_STATUS } from "../common";

export interface IStoreExternalScript {
  name: string;
  src: string;
  position: 'head' | 'body_start' | 'body_end';
  isActive: boolean;
}

export interface IStoreSocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
}

export interface IStoreKycDocument {
  type: KYC_DOCUMENT_TYPE;
  documentUrl: string;
  verified: boolean;
}

export interface IStoreAddress {
  country: string;
  state: string;
  city: string;
  pincode: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
}

export interface IStoreThemeConfig {
  colors: Record<string, any>;
  fonts: Record<string, any>;
  spacing: Record<string, any>;
}

export interface IStoreType {
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  banner: string | null;
  themeId: Types.ObjectId | string;
  themeIds: (Types.ObjectId | string)[];
  themeConfig: IStoreThemeConfig;
  userId: Types.ObjectId | string;
  subdomain: string;
  customDomain: string | null;
  domainVerified: boolean;
  isActive: boolean;
  isPublished: boolean;
  isBlocked: boolean;
  businessName: string;
  businessType: string;
  gstNumber: string;
  panNumber: string;
  kycStatus: KYC_STATUS;
  kycDocuments: IStoreKycDocument[];
  address: IStoreAddress;
  email: string;
  phone: string;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  externalScripts: IStoreExternalScript[];
  socialLinks: IStoreSocialLinks;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateStorePayload {
  name: string;
  slug: string;
  description?: string;
  logo?: string | null;
  banner?: string | null;
  themeId?: Types.ObjectId | string;
  themeIds?: (Types.ObjectId | string)[];
  themeConfig?: Partial<IStoreThemeConfig>;
  userId: Types.ObjectId | string;
  subdomain: string;
  customDomain?: string | null;
  domainVerified?: boolean;
  isActive?: boolean;
  isPublished?: boolean;
  isBlocked?: boolean;
  businessName: string;
  businessType: string;
  gstNumber?: string;
  panNumber?: string;
  kycStatus?: KYC_STATUS;
  kycDocuments?: IStoreKycDocument[];
  address: IStoreAddress;
  email: string;
  phone: string;
}

export interface IUpdateStorePayload extends Partial<ICreateStorePayload> {}

export interface IStore extends Document {
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  banner: string | null;
  themeId: Types.ObjectId | string;
  themeIds: (Types.ObjectId | string)[];
  themeConfig: IStoreThemeConfig;
  userId: Types.ObjectId | string;
  subdomain: string;
  customDomain: string | null;
  domainVerified: boolean;
  isActive: boolean;
  isPublished: boolean;
  isBlocked: boolean;
  businessName: string;
  businessType: string;
  gstNumber: string;
  panNumber: string;
  kycStatus: KYC_STATUS;
  kycDocuments: IStoreKycDocument[];
  address: IStoreAddress;
  email: string;
  phone: string;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  externalScripts: IStoreExternalScript[];
  socialLinks: IStoreSocialLinks;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
