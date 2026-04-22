import { Document, Types } from "mongoose";

export type ORDER_STATUS = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "completed" | "cancelled";
export type ORDER_FINANCIAL_STATUS = "pending" | "paid" | "partially_paid" | "refunded" | "partially_refunded" | "failed";
export type ORDER_FULFILLMENT_STATUS = "unfulfilled" | "partial" | "fulfilled" | "shipped" | "delivered" | "cancelled";
export type ORDER_CURRENCY = "INR";
export type ORDER_PAYMENT_METHOD = "razorpay" | "phonepe" | "cod" | "card" | "upi" | "netbanking";
export type ORDER_PAYMENT_STATUS = "pending" | "success" | "failed" | "refunded";
export type ORDER_SHIPMENT_STATUS = "pending" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "returned" | "cancelled";

export interface IOrderLineItemType {
  productId: Types.ObjectId | string;
  variantId: Types.ObjectId | string | null;
  title: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IOrderAddressType {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
}

export interface IOrderPaymentDetailsType {
  method: ORDER_PAYMENT_METHOD;
  transactionId: string;
  status: ORDER_PAYMENT_STATUS;
  paidAt: Date | null;
}

export interface IOrderFulfillmentType {
  trackingNumber: string;
  carrier: string;
  status: ORDER_SHIPMENT_STATUS;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

export interface IOrderType {
  storeId: Types.ObjectId | string;
  sourceDomain?: string | null;
  customerId: Types.ObjectId | string | null;
  orderNumber: number;
  orderName: string;
  email: string;
  phone: string;
  status: ORDER_STATUS;
  financialStatus: ORDER_FINANCIAL_STATUS;
  fulfillmentStatus: ORDER_FULFILLMENT_STATUS;
  currency: ORDER_CURRENCY;
  subtotalPrice: number;
  totalTax: number;
  shippingPrice: number;
  discountTotal: number;
  totalPrice: number;
  lineItems: IOrderLineItemType[];
  shippingAddress: IOrderAddressType;
  billingAddress: IOrderAddressType;
  paymentDetails: IOrderPaymentDetailsType;
  fulfillments: IOrderFulfillmentType[];
  notes: string;
  tags: string[];
  isPaid: boolean;
  isDelivered: boolean;
  isCancelled: boolean;
  cancelReason: string | null;
  cancelledAt: Date | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrderPayload {
  storeId: Types.ObjectId | string;
  sourceDomain?: string | null;
  customerId?: Types.ObjectId | string | null;
  orderNumber?: number;
  orderName?: string;
  email: string;
  phone: string;
  status?: ORDER_STATUS;
  financialStatus?: ORDER_FINANCIAL_STATUS;
  fulfillmentStatus?: ORDER_FULFILLMENT_STATUS;
  currency?: ORDER_CURRENCY;
  subtotalPrice?: number;
  totalTax?: number;
  shippingPrice?: number;
  discountTotal?: number;
  totalPrice?: number;
  lineItems: IOrderLineItemType[];
  shippingAddress: IOrderAddressType;
  billingAddress?: IOrderAddressType;
  paymentDetails?: Partial<IOrderPaymentDetailsType>;
  fulfillments?: IOrderFulfillmentType[];
  notes?: string;
  tags?: string[];
  isPaid?: boolean;
  isDelivered?: boolean;
  isCancelled?: boolean;
  cancelReason?: string | null;
  cancelledAt?: Date | string | null;
  isActive?: boolean;
}

export interface IUpdateOrderPayload extends Partial<ICreateOrderPayload> {}

export interface IOrder extends Document {
  storeId: Types.ObjectId | string;
  sourceDomain?: string | null;
  customerId: Types.ObjectId | string | null;
  orderNumber: number;
  orderName: string;
  email: string;
  phone: string;
  status: ORDER_STATUS;
  financialStatus: ORDER_FINANCIAL_STATUS;
  fulfillmentStatus: ORDER_FULFILLMENT_STATUS;
  currency: ORDER_CURRENCY;
  subtotalPrice: number;
  totalTax: number;
  shippingPrice: number;
  discountTotal: number;
  totalPrice: number;
  lineItems: IOrderLineItemType[];
  shippingAddress: IOrderAddressType;
  billingAddress: IOrderAddressType;
  paymentDetails: IOrderPaymentDetailsType;
  fulfillments: IOrderFulfillmentType[];
  notes: string;
  tags: string[];
  isPaid: boolean;
  isDelivered: boolean;
  isCancelled: boolean;
  cancelReason: string | null;
  cancelledAt: Date | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
