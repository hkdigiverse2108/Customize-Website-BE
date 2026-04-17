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
    STRIPE = "stripe",
    PHONEPE = "phonepe"
}

export enum PAYMENT_STATUS {
    SUCCESS = "success",
    FAILED = "failed",
    PENDING = "pending"
}

export enum PAYMENT_FOR {
    PLAN_SUBSCRIPTION = "plan_subscription",
    THEME_PURCHASE = "theme_purchase"
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
