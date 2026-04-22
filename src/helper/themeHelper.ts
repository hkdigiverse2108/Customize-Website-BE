import { ACCOUNT_TYPE } from "../common";
import { blogModel, orderModel, planModel, productModel, storeModel, userModel, userLimitModel } from "../database";
import { syncUserUsage } from "./limitHelper";

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

  // Sync usage before validating
  let userLimits: any = await syncUserUsage(user._id);
  if (!userLimits) {
    userLimits = await userLimitModel.create({ userId: user._id });
  }

  const { usage } = userLimits;

  // 1. Check Replacement Limits (Themes, Products, Blogs)
  // These are not additive; the new plan's limit must be enough for current usage.

  if (newPlan.themeLimit !== -1 && usage.themes > newPlan.themeLimit) {
    return {
      allowed: false,
      message: `Cannot switch to ${newPlan.name}. You are using ${usage.themes} themes, but this plan only allows ${newPlan.themeLimit}.`,
      type: "THEME_LIMIT_EXCEEDED"
    };
  }

  if (newPlan.productLimit !== -1 && usage.products > newPlan.productLimit) {
    return {
      allowed: false,
      message: `Cannot switch to ${newPlan.name}. You have ${usage.products} products, but this plan only allows ${newPlan.productLimit}.`,
      type: "PRODUCT_LIMIT_EXCEEDED"
    };
  }

  if (newPlan.blogLimit !== -1 && usage.blogs > newPlan.blogLimit) {
    return {
      allowed: false,
      message: `Cannot switch to ${newPlan.name}. You have ${usage.blogs} blogs, but this plan only allows ${newPlan.blogLimit}.`,
      type: "BLOG_LIMIT_EXCEEDED"
    };
  }

  // 2. Additive Limits (Orders, Offers)
  // These are always allowed because the new plan limit will be added to what's remaining.
  // No validation needed for these during switch.

  return { allowed: true, plan: newPlan };
};
