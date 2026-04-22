import { Schema, model } from "mongoose";
import { IOrder } from "../../type";
import {
  ORDER_STATUS,
  FINANCIAL_STATUS,
  FULFILLMENT_STATUS,
  ORDER_CURRENCY,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  SHIPMENT_STATUS
} from "../../common/enum";

const orderStatuses = Object.values(ORDER_STATUS);
const financialStatuses = Object.values(FINANCIAL_STATUS);
const fulfillmentStatuses = Object.values(FULFILLMENT_STATUS);
const orderCurrencies = Object.values(ORDER_CURRENCY);
const paymentMethods = Object.values(PAYMENT_METHOD);
const paymentStatuses = Object.values(PAYMENT_STATUS);
const shipmentStatuses = Object.values(SHIPMENT_STATUS);

const orderLineItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "product", required: true },
    variantId: { type: Schema.Types.ObjectId, default: null },
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderAddressSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: "", trim: true },
    address1: { type: String, required: true, trim: true },
    address2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderPaymentDetailsSchema = new Schema(
  {
    method: { type: String, enum: paymentMethods, default: "cod", required: true },
    transactionId: { type: String, default: "", trim: true },
    status: { type: String, enum: paymentStatuses, default: "pending", required: true },
    paidAt: { type: Date, default: null },
  },
  { _id: false }
);

const orderFulfillmentSchema = new Schema(
  {
    trackingNumber: { type: String, default: "", trim: true },
    carrier: { type: String, default: "", trim: true },
    status: { type: String, enum: shipmentStatuses, default: "pending" },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "store", required: true, index: true },
    sourceDomain: { type: String, trim: true, lowercase: true, default: null },
    customerId: { type: Schema.Types.ObjectId, ref: "user", default: null, index: true },
    orderNumber: { type: Number, required: true, min: 1 },
    orderName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    status: { type: String, enum: orderStatuses, default: "pending", required: true },
    financialStatus: { type: String, enum: financialStatuses, default: "pending", required: true },
    fulfillmentStatus: { type: String, enum: fulfillmentStatuses, default: "unfulfilled", required: true },
    currency: { type: String, enum: orderCurrencies, default: "INR", required: true },
    subtotalPrice: { type: Number, default: 0, min: 0 },
    totalTax: { type: Number, default: 0, min: 0 },
    shippingPrice: { type: Number, default: 0, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    lineItems: { type: [orderLineItemSchema], default: [] },
    shippingAddress: { type: orderAddressSchema, required: true },
    billingAddress: { type: orderAddressSchema, required: true },
    paymentDetails: { type: orderPaymentDetailsSchema, default: () => ({}) },
    fulfillments: { type: [orderFulfillmentSchema], default: [] },
    notes: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },
    isPaid: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: false },
    isCancelled: { type: Boolean, default: false },
    cancelReason: { type: String, default: null, trim: true },
    cancelledAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

orderSchema.pre("validate", function () {
  if (typeof this.orderName === "string") this.orderName = this.orderName.trim();
  if (!this.orderName && this.orderNumber) this.orderName = `#${this.orderNumber}`;

  const lineItems = Array.isArray(this.lineItems) ? this.lineItems : [];
  let subtotalFromItems = 0;

  lineItems.forEach((item: any) => {
    const quantity = Number(item?.quantity) > 0 ? Number(item.quantity) : 1;
    const price = Number(item?.price) >= 0 ? Number(item.price) : 0;
    const fallbackTotal = quantity * price;
    const itemTotal = Number(item?.total);

    item.total = Number.isFinite(itemTotal) && itemTotal >= 0 ? itemTotal : fallbackTotal;
    subtotalFromItems += item.total;
  });

  if (!Number.isFinite(this.subtotalPrice) || this.subtotalPrice < 0) this.subtotalPrice = 0;
  if (this.subtotalPrice === 0 && subtotalFromItems > 0) this.subtotalPrice = subtotalFromItems;

  if (!Number.isFinite(this.totalTax) || this.totalTax < 0) this.totalTax = 0;
  if (!Number.isFinite(this.shippingPrice) || this.shippingPrice < 0) this.shippingPrice = 0;
  if (!Number.isFinite(this.discountTotal) || this.discountTotal < 0) this.discountTotal = 0;

  const computedTotal = Math.max(this.subtotalPrice + this.totalTax + this.shippingPrice - this.discountTotal, 0);
  if (!Number.isFinite(this.totalPrice) || this.totalPrice < 0 || this.totalPrice === 0) this.totalPrice = computedTotal;

  if (this.financialStatus === "paid") this.isPaid = true;
  if (this.fulfillmentStatus === "delivered") this.isDelivered = true;

  if (this.status === "cancelled" || this.fulfillmentStatus === "cancelled" || this.isCancelled === true) {
    this.status = "cancelled";
    this.isCancelled = true;
    if (!this.cancelledAt) this.cancelledAt = new Date();
  } else {
    this.isCancelled = false;
    this.cancelReason = null;
    this.cancelledAt = null;
  }
});

orderSchema.index({ storeId: 1, orderNumber: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
orderSchema.index({ storeId: 1, sourceDomain: 1, createdAt: -1 });
orderSchema.index({ storeId: 1, customerId: 1, createdAt: -1 });
orderSchema.index({ storeId: 1, status: 1, financialStatus: 1, fulfillmentStatus: 1, createdAt: -1 });
orderSchema.index({ storeId: 1, isPaid: 1, isDelivered: 1, isCancelled: 1 });
orderSchema.index({ storeId: 1, email: 1, phone: 1 });

export const orderModel = model<IOrder>("order", orderSchema);
