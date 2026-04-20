import { Document, Types } from "mongoose";

export type THEME_SUPPORTED_PAGE = "home" | "product" | "category" | "cart" | "checkout" | "custom" | "collection";

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

export interface IPageLayoutItem {
  componentId: string;
  order: number;
  config: Record<string, any>;
}

export interface IThemeLayoutJSON {
  home: IPageLayoutItem[];
  product: IPageLayoutItem[];
  cart: IPageLayoutItem[];
  collection: IPageLayoutItem[];
  [key: string]: IPageLayoutItem[];
}

export interface IThemeType {
  name: string;
  slug: string;
  isGlobal: boolean;
  storeId: Types.ObjectId | string | null;
  styles: IThemeStyles;
  layoutJSON: IThemeLayoutJSON;
  previewImage: string;
  category: string;
  tags: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITheme extends Document {
  name: string;
  slug: string;
  isGlobal: boolean;
  storeId: Types.ObjectId | string | null;
  styles: IThemeStyles;
  layoutJSON: IThemeLayoutJSON;
  previewImage: string;
  category: string;
  tags: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
