import { Document, Types } from "mongoose";

import { IThemeSettingItem } from "../theme";

export interface IVisualSettingType {
  storeId: Types.ObjectId | string;
  settings: IThemeSettingItem[];
  isDeleted: boolean;
}


export interface IVisualSetting extends IVisualSettingType, Document {}
