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

export enum VERIFICATION_STATUS {
    PENDING = "pending",
    VERIFIED = "verified",
    FAILED = "failed"
}

export enum KYC_DOCUMENT_TYPE {
    AADHAAR = "aadhaar",
    PAN = "pan",
    GST = "gst"
}

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

export enum POLICY_TYPE {
    RETURN_AND_REFUND = "return_and_refund",
    PRIVACY = "privacy",
    TERMS_OF_SERVICE = "terms_of_service",
    SHIPPING = "shipping",
    CONTACT_INFORMATION = "contact_information",
    LEGAL_NOTICE = "legal_notice",
}

// Settings Enums
export enum SETTING_FIELD_STATUS {
    DISABLED = "disabled",
    OPTIONAL = "optional",
    REQUIRED = "required"
}

export enum AUTH_METHOD {
    EMAIL = "email",
    PHONE_OR_EMAIL = "phone_or_email"
}

export enum VISIBILITY_STATUS {
    HIDDEN = "hidden",
    OPTIONAL = "optional",
    REQUIRED = "required"
}

export enum EMAIL_PROVIDER {
    GMAIL = "gmail",
    SMTP = "smtp",
    RESEND = "resend",
    SENDGRID = "sendgrid"
}

export enum MEASUREMENT_SYSTEM {
    METRIC = "metric",
    IMPERIAL = "imperial"
}

// Collection Enums
export enum COLLECTION_TYPE {
    MANUAL = "manual",
    SMART = "smart",
}

export enum COLLECTION_STATUS {
    DRAFT = "draft",
    ACTIVE = "active",
    ARCHIVED = "archived"
}

export enum COLLECTION_RULE_CONDITION {
    AND = "AND",
    OR = "OR"
}

export enum COLLECTION_RULE_FIELD {
    PRICE = "price",
    TAG = "tag",
    TITLE = "title",
    VENDOR = "vendor",
    PRODUCT_TYPE = "productType"
}

export enum COLLECTION_OPERATOR {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    CONTAINS = "contains",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than"
}

export enum COLLECTION_SORT_ORDER {
    MANUAL = "manual",
    BEST_SELLING = "best-selling",
    PRICE_ASCENDING = "price-ascending",
    PRICE_DESCENDING = "price-descending",
    TITLE_ASCENDING = "title-ascending",
    TITLE_DESCENDING = "title-descending",
    CREATED_DESC = "created-desc",
    CREATED_ASC = "created-asc"
}

// Component Enums
export enum COMPONENT_TYPE {
    HEADER = "header",
    FOOTER = "footer",
    BANNER = "banner",
    PRODUCT_GRID = "productGrid",
    CUSTOM = "custom"
}

export enum COMPONENT_CATEGORY {
    LAYOUT = "layout",
    MARKETING = "marketing",
    ECOMMERCE = "ecommerce"
}

// Page Enums
export enum SUPPORTED_PAGE {
    HOME = "home",
    PRODUCT = "product",
    CATEGORY = "category",
    CART = "cart",
    CHECKOUT = "checkout",
    CUSTOM = "custom"
}

export enum PAGE_TYPE {
    HOME = "home",
    PRODUCT = "product",
    CATEGORY = "category",
    CUSTOM = "custom"
}

export enum PAGE_VISIBILITY {
    PUBLIC = "public",
    PRIVATE = "private",
    PASSWORD = "password"
}

export enum PRODUCT_STATUS {
    DRAFT = "draft",
    ACTIVE = "active",
    ARCHIVED = "archived"
}

export enum BLOG_STATUS {
    DRAFT = "draft",
    ACTIVE = "active",
    ARCHIVED = "archived"
}
