export enum ACCOUNT_TYPE {
    ADMIN = "admin",
    VENDOR = "vendor",
    USER = "user"
}

export enum SUBSCRIPTION_TYPE {
    FREE = "free",
    BASIC = "basic",
    PRO = "pro"
}

export enum SUBSCRIPTION_STATUS {
    ACTIVE = "active",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}

export enum PLAN_DURATION {
    MONTHLY = "monthly",
    YEARLY = "yearly"
}

export enum PAYMENT_METHOD {
    RAZORPAY = "razorpay",
    PHONEPE = "phonepe",
    COD = "cod",
    CARD = "card",
    UPI = "upi",
    NETBANKING = "netbanking"
}

export enum PAYMENT_STATUS {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    REFUNDED = "refunded"
}

export enum PAYMENT_FOR {
    PLAN_SUBSCRIPTION = "plan_subscription",
    THEME_PURCHASE = "theme_purchase",
    ORDER_PURCHASE = "order_purchase"
}

export enum KYC_STATUS {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}

export enum KYC_DOCUMENT_TYPE {
    AADHAAR = "aadhaar",
    PAN = "pan",
    GST = "gst"
}

export const collectionTypes = {
  MANUAL: "manual",
  SMART: "smart",
};

export enum ORDER_STATUS {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}

export enum FINANCIAL_STATUS {
    PENDING = "pending",
    PAID = "paid",
    PARTIALLY_PAID = "partially_paid",
    REFUNDED = "refunded",
    PARTIALLY_REFUNDED = "partially_refunded",
    FAILED = "failed"
}

export enum FULFILLMENT_STATUS {
    UNFULFILLED = "unfulfilled",
    PARTIAL = "partial",
    FULFILLED = "fulfilled",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}

export enum ORDER_CURRENCY {
    INR = "INR"
}

export enum SHIPMENT_STATUS {
    PENDING = "pending",
    PACKED = "packed",
    SHIPPED = "shipped",
    OUT_FOR_DELIVERY = "out_for_delivery",
    DELIVERED = "delivered",
    RETURNED = "returned",
    CANCELLED = "cancelled"
}

export enum DISCOUNT_TYPE {
    PERCENTAGE = "percentage",
    FIXED_AMOUNT = "fixed_amount",
    FREE_SHIPPING = "free_shipping",
    BUY_X_GET_Y = "buy_x_get_y"
}

export enum DISCOUNT_APPLIES_TO {
    ALL = "all",
    PRODUCTS = "products",
    COLLECTIONS = "collections"
}
