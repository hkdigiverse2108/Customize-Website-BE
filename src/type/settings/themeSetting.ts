import { Document, Types } from "mongoose";

export interface IThemeSettingType {
  storeId: Types.ObjectId | string;
  themeId: Types.ObjectId | string;
  themeConfig: any; // Dynamic configuration based on the theme
  isPublished: boolean;
  isDeleted: boolean;
}

export interface IThemeSetting extends IThemeSettingType, Document {}
