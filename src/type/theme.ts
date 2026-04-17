import { Document, Types } from "mongoose";

export type THEME_SUPPORTED_PAGE = "home" | "product" | "category" | "cart" | "checkout" | "custom";

export interface IThemeDefaultConfig {
  colors: Record<string, any>;
  fonts: Record<string, any>;
  spacing: Record<string, any>;
  buttons: Record<string, any>;
}

export interface IThemeBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface IThemeChangelog {
  version: string;
  changes: string;
  date: Date;
}

export interface IThemeType {
  name: string;
  slug: string;
  description: string;
  previewImage: string;
  demoUrl: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  price: number;
  layoutJSON: Record<string, any>;
  supportedComponents: string[];
  defaultConfig: IThemeDefaultConfig;
  supportedPages: THEME_SUPPORTED_PAGE[];
  isResponsive: boolean;
  breakpoints: IThemeBreakpoints;
  seoFriendly: boolean;
  performanceScore: number | null;
  lazyLoadEnabled: boolean;
  version: string;
  changelog: IThemeChangelog[];
  createdBy: Types.ObjectId | string | null;
  authorName: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITheme extends Document {
  name: string;
  slug: string;
  description: string;
  previewImage: string;
  demoUrl: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  price: number;
  layoutJSON: Record<string, any>;
  supportedComponents: string[];
  defaultConfig: IThemeDefaultConfig;
  supportedPages: THEME_SUPPORTED_PAGE[];
  isResponsive: boolean;
  breakpoints: IThemeBreakpoints;
  seoFriendly: boolean;
  performanceScore: number | null;
  lazyLoadEnabled: boolean;
  version: string;
  changelog: IThemeChangelog[];
  createdBy: Types.ObjectId | string | null;
  authorName: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
