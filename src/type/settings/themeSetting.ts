import { Document, Types } from "mongoose";
import { IThemeStyles, IThemeSettingItem } from "../theme";


export interface IThemeSettingType {
  storeId: Types.ObjectId | string;
  themeId: Types.ObjectId | string;
  customLayoutJSON: any;
  draftLayoutJSON: any;
  customStyles: IThemeStyles;
  customSettings: IThemeSettingItem[];
  baseVersion: string;
  isPublished: boolean;
  isDeleted: boolean;
}


export interface IThemeSetting extends IThemeSettingType, Document {}
