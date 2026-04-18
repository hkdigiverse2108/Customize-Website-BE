import { Document, Types } from "mongoose";

export type COLLECTION_TYPE = "manual" | "smart";
export type COLLECTION_STATUS = "draft" | "active" | "archived";
export type COLLECTION_RULE_CONDITION = "AND" | "OR";
export type COLLECTION_RULE_FIELD = "price" | "tag" | "title" | "vendor" | "productType";
export type COLLECTION_RULE_OPERATOR = "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
export type COLLECTION_SORT_ORDER =
  | "manual"
  | "best-selling"
  | "price-ascending"
  | "price-descending"
  | "title-ascending"
  | "title-descending"
  | "created-desc"
  | "created-asc";

export interface ICollectionRuleType {
  field: COLLECTION_RULE_FIELD;
  operator: COLLECTION_RULE_OPERATOR;
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
