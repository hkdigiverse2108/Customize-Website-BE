import { Document, Types } from "mongoose";
import { COLLECTION_TYPE, COLLECTION_STATUS, COLLECTION_RULE_CONDITION, COLLECTION_RULE_FIELD, COLLECTION_OPERATOR, COLLECTION_SORT_ORDER } from "../common";

export interface ICollectionRuleType {
  field: COLLECTION_RULE_FIELD;
  operator: COLLECTION_OPERATOR;
  value: any;
}

export interface ICollectionImageType {
  url: string;
  alt: string;
}

export interface ICollectionSeoType {
  title: string;
  description: string;
}

export interface ICollectionType {
  storeId: Types.ObjectId | string;
  title: string;
  handle: string;
  type: COLLECTION_TYPE;
  status: COLLECTION_STATUS;
  isPublished: boolean;
  publishedAt: Date | null;
  description: string;
  productIds: (Types.ObjectId | string)[];
  rules: ICollectionRuleType[];
  ruleCondition: COLLECTION_RULE_CONDITION;
  sortOrder: COLLECTION_SORT_ORDER;
  image: ICollectionImageType;
  seo: ICollectionSeoType;
  tags: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateCollectionPayload {
  storeId: Types.ObjectId | string;
  title: string;
  handle?: string;
  type?: COLLECTION_TYPE;
  status?: COLLECTION_STATUS;
  isPublished?: boolean;
  publishedAt?: Date | string | null;
  description?: string;
  productIds?: (Types.ObjectId | string)[];
  rules?: ICollectionRuleType[];
  ruleCondition?: COLLECTION_RULE_CONDITION;
  sortOrder?: COLLECTION_SORT_ORDER;
  image?: Partial<ICollectionImageType>;
  seo?: Partial<ICollectionSeoType>;
  tags?: string[];
  isActive?: boolean;
}

export interface IUpdateCollectionPayload extends Partial<ICreateCollectionPayload> {}

export interface ICollection extends Document {
  storeId: Types.ObjectId | string;
  title: string;
  handle: string;
  type: COLLECTION_TYPE;
  status: COLLECTION_STATUS;
  isPublished: boolean;
  publishedAt: Date | null;
  description: string;
  productIds: (Types.ObjectId | string)[];
  rules: ICollectionRuleType[];
  ruleCondition: COLLECTION_RULE_CONDITION;
  sortOrder: COLLECTION_SORT_ORDER;
  image: ICollectionImageType;
  seo: ICollectionSeoType;
  tags: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
