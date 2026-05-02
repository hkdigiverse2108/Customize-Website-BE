import { Document, Types } from "mongoose";
import { THEME_SUPPORTED_PAGE as THEME_SUPPORTED_PAGE_ENUM, THEME_TYPE as THEME_TYPE_ENUM } from "../common/enum";

export const THEME_GLOBAL_LAYOUT_SECTIONS = ["header", "footer"] as const;
export type THEME_GLOBAL_LAYOUT_SECTION = (typeof THEME_GLOBAL_LAYOUT_SECTIONS)[number];
export type THEME_SUPPORTED_PAGE = `${THEME_SUPPORTED_PAGE_ENUM}`;
export const THEME_SUPPORTED_PAGES = Object.values(THEME_SUPPORTED_PAGE_ENUM) as THEME_SUPPORTED_PAGE[];
export type THEME_TYPE = `${THEME_TYPE_ENUM}`;
export const THEME_TYPES = Object.values(THEME_TYPE_ENUM) as THEME_TYPE[];

export interface IThemeSettingItem {
  key: string;
  value: any;
  type?: string;
  label?: string;
  group?: string;
}

export type IThemeStyles = IThemeSettingItem[];


export interface IThemeBreakpoints {
  mobile?: number;
  tablet?: number;
  desktop?: number;
  [key: string]: number | undefined;
}



export interface IThemeChangelogItem {
  version?: string;
  changes?: string;
  date?: Date;
}

export interface IPageLayoutItem {
  componentId: string;
  order: number;
  config: IThemeSettingItem[];
}


export interface IPageLayout {
  page: string;
  sections: IPageLayoutItem[];
}

export type IThemeLayoutJSON = IPageLayout[];


export interface IThemeSchemaItem {
  key: string;
  type: string;
  label?: string;
  default?: any;
  options?: any[]; // For select/radio types
  group?: string;
  placeholder?: string;
  validation?: any;
}

export interface IThemeType {
  name: string;
  slug: string;
  description: string;
  demoUrl: string;
  previewImage: string;
  category: string;
  tags: string[];
  type: THEME_TYPE;
  isPremium: boolean;
  price: number;
  styles: IThemeStyles;
  layoutJSON: IThemeLayoutJSON;
  draftLayoutJSON: IThemeLayoutJSON;
  componentSchema: IThemeSchemaItem[];
  settingsSchema: IThemeSchemaItem[];

  defaultConfig: IThemeSettingItem[];

  supportedComponents: string[];
  supportedPages: THEME_SUPPORTED_PAGE[];
  isResponsive: boolean;
  breakpoints: IThemeBreakpoints;
  seoFriendly: boolean;
  performanceScore: number | null;
  lazyLoadEnabled: boolean;
  version: string;
  changelog: IThemeChangelogItem[];
  isGlobal: boolean;
  storeId: Types.ObjectId | string | null;
  createdBy: Types.ObjectId | string | null;
  authorName: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITheme extends Document, IThemeType {}
