import { Document, Types } from "mongoose";

import { IThemeSettingItem } from "../theme";

export interface ISEOSettingType {
  storeId: Types.ObjectId | string;
  settings: IThemeSettingItem[];
  isDeleted: boolean;
}


export interface ISEOSetting extends ISEOSettingType, Document {}
