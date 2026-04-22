import { ACCOUNT_TYPE } from "../common";
import { blogModel, orderModel, planModel, productModel, storeModel, userModel } from "../database";

type ThemeLimitMode = "append" | "replace";

interface ICheckThemeLimitOptions {
  storeId?: string;
  mode?: ThemeLimitMode;
}

const normalizeThemeIds = (themeIds: any[] = []) => {
  return Array.from(
    new Set(
      themeIds
        .filter(Boolean)
        .map((themeId) => String(themeId))
        .filter(Boolean)
    )
  );
};

const getUserPlan = async (userId: string) => {
  const userData: any = await userModel.findOne(
    { _id: userId, isDeleted: { $ne: true } },
    { subscription: 1 },
    { lean: true }
  );

  if (!userData || !userData.subscription?.planId) return null;

  const planId = userData.subscription.planId?._id || userData.subscription.planId;
  return await planModel.findOne({ _id: planId, isDeleted: { $ne: true } }, {}, { lean: true });
};

const getThemeIdsForStore = async (storeId: string) => {
  const store: any = await storeModel.findOne(
    { _id: storeId, isDeleted: { $ne: true } },
    { themeIds: 1 },
    { lean: true }
  );

  return normalizeThemeIds(store?.themeIds || []);
};

const getThemeIdsForUser = async (userId: string) => {
  const stores: any[] = await storeModel.find(
    { userId, isDeleted: { $ne: true } },
    { themeIds: 1 },
    { lean: true }
  );

  const themeIds: any[] = [];
  stores.forEach((store) => {
    themeIds.push(...(store?.themeIds || []));
  });

  return normalizeThemeIds(themeIds);
};

export const checkThemeLimit = async (
  user: any,
  requestedThemeIds: string[] = [],
  options: ICheckThemeLimitOptions = {}
) => {
  if (user?.role === ACCOUNT_TYPE.ADMIN) return { allowed: true };

  const plan: any = await getUserPlan(user?._id);
  if (!plan) {
    return { allowed: false, message: "Active subscription required." };
  }

  const themeLimit = Number(plan.themeLimit);
  if (themeLimit === -1) return { allowed: true };

  const nextThemeIds = normalizeThemeIds(requestedThemeIds);
  let effectiveThemeIds = nextThemeIds;

  if (options.mode !== "replace") {
    const currentThemeIds = options.storeId
      ? await getThemeIdsForStore(options.storeId)
      : await getThemeIdsForUser(user._id);

    effectiveThemeIds = normalizeThemeIds([...currentThemeIds, ...nextThemeIds]);
  }

  if (effectiveThemeIds.length > themeLimit) {
    const scope = options.storeId ? "store" : "account";
    const action = options.mode === "replace" ? "use" : "add";

    return {
      allowed: false,
      message: `Theme limit reached. Your ${plan.name} plan allows up to ${themeLimit} themes per ${scope}. You tried to ${action} ${effectiveThemeIds.length}.`,
      limit: themeLimit,
      current: effectiveThemeIds.length,
    };
  }

  return {
    allowed: true,
    limit: themeLimit,
    current: effectiveThemeIds.length,
  };
};

export const checkBlogLimit = async (user: any, storeId: string) => {
  if (user?.role === ACCOUNT_TYPE.ADMIN) return { allowed: true };

  const plan: any = await getUserPlan(user?._id);
  if (!plan) {
    return { allowed: false, message: "Active subscription required." };
  }

  const blogCount = await blogModel.countDocuments({ storeId, isDeleted: { $ne: true } });

  if (blogCount >= plan.blogLimit) {
    return {
      allowed: false,
      message: `Blog limit reached for this store. Your ${plan.name} plan allows up to ${plan.blogLimit} blogs per store. Please upgrade for more.`,
      limit: plan.blogLimit,
      current: blogCount
    };
  }

  return { allowed: true };
};

export const checkStoreLimit = async (userId: string) => {
  const storeCount = await storeModel.countDocuments({ userId, isDeleted: { $ne: true } });

  if (storeCount >= 1) {
    return {
      allowed: false,
      message: "Each vendor can only create 1 store.",
      limit: 1,
      current: storeCount,
    };
  }

  return { allowed: true };
};

export const verifyThemeForStore = async (storeId: string, themeId: string) => {
  const store: any = await storeModel.findOne(
    { _id: storeId, isDeleted: { $ne: true } },
    { themeIds: 1 },
    { lean: true }
  );

  if (!store) return false;

  return normalizeThemeIds(store.themeIds || []).includes(String(themeId));
};

export const validatePlanSwitch = async (user: any, newPlanId: string) => {
  if (user?.role === ACCOUNT_TYPE.ADMIN) return { allowed: true };

  const newPlan: any = await planModel.findOne({ _id: newPlanId, isDeleted: { $ne: true } }, {}, { lean: true });
  if (!newPlan) return { allowed: false, message: "New plan not found." };

  const stores: any[] = await storeModel.find(
    { userId: user._id, isDeleted: { $ne: true } },
    { name: 1, themeIds: 1 },
    { lean: true }
  );

  // Check Theme Limit per store
  if (newPlan.themeLimit !== -1) {
    const violatingStore = stores.find((store) => normalizeThemeIds(store?.themeIds || []).length > newPlan.themeLimit);

    if (violatingStore) {
      const violatingCount = normalizeThemeIds(violatingStore?.themeIds || []).length;
      return {
        allowed: false,
        message: `Cannot switch to ${newPlan.name}. Store "${violatingStore.name}" uses ${violatingCount} themes, but this plan only allows ${newPlan.themeLimit} per store.`,
        type: "THEME_LIMIT_EXCEEDED"
      };
    }
  }

  // Check Blog, Product, and Order Limits across all stores
  for (const store of stores) {
    // Blog limit
    if (newPlan.blogLimit !== -1) {
      const blogCount = await blogModel.countDocuments({ storeId: store._id, isDeleted: { $ne: true } });
      if (blogCount > newPlan.blogLimit) {
        return {
          allowed: false,
          message: `Cannot switch to ${newPlan.name}. Store "${store.name}" has ${blogCount} blogs, exceeding the limit of ${newPlan.blogLimit}.`,
          type: "BLOG_LIMIT_EXCEEDED"
        };
      }
    }

    // Product limit
    if (newPlan.productLimit !== -1) {
      const productCount = await productModel.countDocuments({ storeId: store._id, isDeleted: { $ne: true } });
      if (productCount > newPlan.productLimit) {
        return {
          allowed: false,
          message: `Cannot switch to ${newPlan.name}. Store "${store.name}" has ${productCount} products, exceeding the limit of ${newPlan.productLimit}.`,
          type: "PRODUCT_LIMIT_EXCEEDED"
        };
      }
    }

    // Order limit (total orders for the store)
    if (newPlan.orderLimit !== -1) {
      const orderCount = await orderModel.countDocuments({ storeId: store._id, isDeleted: { $ne: true } });
      if (orderCount > newPlan.orderLimit) {
        return {
          allowed: false,
          message: `Cannot switch to ${newPlan.name}. Store "${store.name}" has ${orderCount} orders, exceeding the new plan's limit of ${newPlan.orderLimit}.`,
          type: "ORDER_LIMIT_EXCEEDED"
        };
      }
    }
  }

  return { allowed: true, plan: newPlan };
};
