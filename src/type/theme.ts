import { Document, Types } from "mongoose";
import { THEME_SUPPORTED_PAGE as THEME_SUPPORTED_PAGE_ENUM, THEME_TYPE as THEME_TYPE_ENUM } from "../common/enum";

export const THEME_GLOBAL_LAYOUT_SECTIONS = ["header", "footer"] as const;
export type THEME_GLOBAL_LAYOUT_SECTION = (typeof THEME_GLOBAL_LAYOUT_SECTIONS)[number];
export type THEME_SUPPORTED_PAGE = `${THEME_SUPPORTED_PAGE_ENUM}`;
export const THEME_SUPPORTED_PAGES = Object.values(THEME_SUPPORTED_PAGE_ENUM) as THEME_SUPPORTED_PAGE[];
export type THEME_TYPE = `${THEME_TYPE_ENUM}`;
export const THEME_TYPES = Object.values(THEME_TYPE_ENUM) as THEME_TYPE[];

export interface IThemeStyles {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: {
    containerWidth: "full" | "boxed";
    spacing: string;
  };
}

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
  config: Record<string, any>;
}

export interface IThemeLayoutJSON {
  header?: IPageLayoutItem[];
  home?: IPageLayoutItem[];
  product?: IPageLayoutItem[];
  category?: IPageLayoutItem[];
  cart?: IPageLayoutItem[];
  checkout?: IPageLayoutItem[];
  custom?: IPageLayoutItem[];
  collection?: IPageLayoutItem[];
  footer?: IPageLayoutItem[];
  [key: string]: IPageLayoutItem[] | undefined;
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
  defaultConfig: Record<string, any>;
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
