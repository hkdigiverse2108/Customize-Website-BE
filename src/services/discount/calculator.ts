import { DISCOUNT_TYPE, DISCOUNT_APPLIES_TO } from "../../common";

interface CartItem {
  productId: string;
  price: number;
  quantity: number;
  collectionIds: string[];
}

interface DiscountValidationResult {
  isValid: boolean;
  message?: string;
  discountAmount: number;
}

export const calculateDiscount = (discount: any, cart: CartItem[]): DiscountValidationResult => {
  const now = new Date();

  // 1. Basic Validations
  if (!discount.isActive || discount.isDeleted) return { isValid: false, discountAmount: 0, message: "Discount is inactive" };
  if (discount.startsAt > now) return { isValid: false, discountAmount: 0, message: "Discount not yet started" };
  if (discount.endsAt && discount.endsAt < now) return { isValid: false, discountAmount: 0, message: "Discount expired" };
  if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
      return { isValid: false, discountAmount: 0, message: "Usage limit reached" };
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 2. Minimum Order Value Check
  if (discount.minOrderValue > 0 && cartTotal < discount.minOrderValue) {
    return { isValid: false, discountAmount: 0, message: `Minimum order value of ${discount.minOrderValue} required` };
  }

  // 3. Prerequisite Products Check (e.g., Buy X)
  if (discount.prerequisiteProductIds && discount.prerequisiteProductIds.length > 0) {
    const matchingPrerequisites = cart.filter(item => 
        discount.prerequisiteProductIds.map(String).includes(String(item.productId))
    );
    const totalPrerequisiteQty = matchingPrerequisites.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalPrerequisiteQty < discount.prerequisiteQuantity) {
        return { isValid: false, discountAmount: 0, message: `Buy at least ${discount.prerequisiteQuantity} of prerequisite products` };
    }
  }

  // 4. Calculate Discount Amount
  let amount = 0;

  if (discount.type === DISCOUNT_TYPE.PERCENTAGE) {
    if (discount.appliesTo === DISCOUNT_APPLIES_TO.ALL) {
        amount = (cartTotal * discount.value) / 100;
    } else if (discount.appliesTo === DISCOUNT_APPLIES_TO.PRODUCTS) {
        const applicableTotal = cart
            .filter(item => discount.productIds.map(String).includes(String(item.productId)))
            .reduce((sum, item) => sum + item.price * item.quantity, 0);
        amount = (applicableTotal * discount.value) / 100;
    } else if (discount.appliesTo === DISCOUNT_APPLIES_TO.COLLECTIONS) {
        const applicableTotal = cart
            .filter(item => item.collectionIds.some(cid => discount.collectionIds.map(String).includes(String(cid))))
            .reduce((sum, item) => sum + item.price * item.quantity, 0);
        amount = (applicableTotal * discount.value) / 100;
    }

    if (discount.maxDiscountAmount > 0) {
        amount = Math.min(amount, discount.maxDiscountAmount);
    }
  } 
  
  else if (discount.type === DISCOUNT_TYPE.FIXED_AMOUNT) {
    amount = discount.value;
  }

  else if (discount.type === DISCOUNT_TYPE.BUY_X_GET_Y) {
      // Find the specific products that are entitled to be discounted
      const entitledProducts = cart.filter(item => 
        discount.productIds.map(String).includes(String(item.productId))
      );
      
      if (entitledProducts.length > 0) {
          // Sort by cheapest to apply discount (common e-commerce rule)
          entitledProducts.sort((a, b) => a.price - b.price);
          const itemToDiscount = entitledProducts[0];
          
          // Discount value can be 100% or a fixed reduction for 'Y'
          const qtyToDiscount = Math.min(itemToDiscount.quantity, discount.entitledQuantity);
          amount = (itemToDiscount.price * discount.value / 100) * qtyToDiscount;
      }
  }

  return {
    isValid: amount > 0,
    discountAmount: Math.max(0, amount),
    message: amount > 0 ? "Discount applied" : "Discount conditions not met"
  };
};
