export enum ACCOUNT_TYPE {
    ADMIN = "admin",
    STORE_OWNER = "store_owner"
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
