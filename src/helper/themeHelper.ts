import { ACCOUNT_TYPE } from "../common";
import { planModel, storeModel, userModel, blogModel } from "../database";
import { getFirstMatch, countData } from "../helper";

export const checkThemeLimit = async (user: any, requestedThemeIds: string[] = []) => {
    if (user.role === ACCOUNT_TYPE.ADMIN) return { allowed: true };

    const userData: any = await getFirstMatch(userModel, { _id: user._id, isDeleted: { $ne: true } }, {}, {});
    if (!userData || !userData.subscription?.planId) {
        return { allowed: false, message: "Active subscription required." };
    }

    const plan: any = await getFirstMatch(planModel, { _id: userData.subscription.planId, isDeleted: { $ne: true } }, {}, {});
    if (!plan) return { allowed: false, message: "Subscription plan not found." };

    // Count unique themes across all user's stores (themeIds)
    const currentThemeIds = new Set<string>();

    const stores = await storeModel.find({ userId: user._id, isDeleted: { $ne: true } });
    stores.forEach(store => {
        if (store.themeIds) store.themeIds.forEach((id: any) => currentThemeIds.add(id.toString()));
    });

    // Identify new themes being added
    const newThemes = requestedThemeIds.filter(id => id && !currentThemeIds.has(id.toString()));
    const totalAfterAddition = currentThemeIds.size + newThemes.length;

    if (totalAfterAddition > plan.themeLimit) {
        return {
            allowed: false,
            message: `Theme limit reached. Your ${plan.name} plan allows up to ${plan.themeLimit} unique themes across all stores. Currently using ${currentThemeIds.size}. Please upgrade to access more.`,
            limit: plan.themeLimit,
            current: currentThemeIds.size
        };
    }

    return { allowed: true };
};

export const checkStoreLimit = async (user: any) => {
    if (user.role === ACCOUNT_TYPE.ADMIN) return { allowed: true };

    const userData: any = await getFirstMatch(userModel, { _id: user._id, isDeleted: { $ne: true } }, {}, {});
    if (!userData || !userData.subscription?.planId) {
        return { allowed: false, message: "Active subscription required." };
    }

    const plan: any = await getFirstMatch(planModel, { _id: userData.subscription.planId, isDeleted: { $ne: true } }, {}, {});
    if (!plan) return { allowed: false, message: "Subscription plan not found." };

    const storeCount = await countData(storeModel, { userId: user._id, isDeleted: { $ne: true } });

    if (storeCount >= plan.storeLimit) {
        return {
            allowed: false,
            message: `Store limit reached. Your ${plan.name} plan allows up to ${plan.storeLimit} stores. Please upgrade to create more.`,
            limit: plan.storeLimit,
            current: storeCount
        };
    }

    return { allowed: true };
};

export const checkBlogLimit = async (user: any, storeId: string) => {
    if (user.role === ACCOUNT_TYPE.ADMIN) return { allowed: true };

    const userData: any = await getFirstMatch(userModel, { _id: user._id, isDeleted: { $ne: true } }, {}, {});
    if (!userData || !userData.subscription?.planId) {
        return { allowed: false, message: "Active subscription required." };
    }

    const plan: any = await getFirstMatch(planModel, { _id: userData.subscription.planId, isDeleted: { $ne: true } }, {}, {});
    if (!plan) return { allowed: false, message: "Subscription plan not found." };

    const blogCount = await countData(blogModel, { storeId, isDeleted: { $ne: true } });

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

export const verifyThemeForStore = async (storeId: string, themeId: string) => {
    const store: any = await getFirstMatch(storeModel, { _id: storeId, isDeleted: { $ne: true } }, {}, {});
    if (!store) return false;

    if (store.themeIds && store.themeIds.some((id: any) => id.toString() === themeId.toString())) return true;

    return false;
};

export const validatePlanSwitch = async (user: any, newPlanId: string) => {
    if (user.role === ACCOUNT_TYPE.ADMIN) return { allowed: true };

    const newPlan: any = await getFirstMatch(planModel, { _id: newPlanId, isDeleted: { $ne: true } }, {}, {});
    if (!newPlan) return { allowed: false, message: "New plan not found." };

    const stores = await storeModel.find({ userId: user._id, isDeleted: { $ne: true } });
    const storeCount = stores.length;

    // 1. Check Store Limit
    if (storeCount > newPlan.storeLimit) {
        return {
            allowed: false,
            message: `Cannot switch to ${newPlan.name}. You currently have ${storeCount} stores, but this plan only allows ${newPlan.storeLimit}. Please delete excess stores before switching.`,
            type: "STORE_LIMIT_EXCEEDED"
        };
    }

    // 2. Check Theme Limit
    const currentThemeIds = new Set<string>();
    stores.forEach(s => {
        if (s.themeIds) s.themeIds.forEach((id: any) => currentThemeIds.add(id.toString()));
    });

    if (currentThemeIds.size > newPlan.themeLimit) {
        return {
            allowed: false,
            message: `Cannot switch to ${newPlan.name}. You are using ${currentThemeIds.size} unique themes, but this plan only allows ${newPlan.themeLimit}.`,
            type: "THEME_LIMIT_EXCEEDED"
        };
    }

    // 3. Check Blog Limits across all stores
    for (const store of stores) {
        const blogCount = await countData(blogModel, { storeId: store._id, isDeleted: { $ne: true } });
        if (blogCount > newPlan.blogLimit) {
            return {
                allowed: false,
                message: `Cannot switch to ${newPlan.name}. Your store "${store.name}" has ${blogCount} blogs, which exceeds the limit of ${newPlan.blogLimit}.`,
                type: "BLOG_LIMIT_EXCEEDED"
            };
        }
    }

    return { allowed: true };
};
