import { ACCOUNT_TYPE } from "../common";
import { planModel, storeModel, userModel } from "../database";
import { getFirstMatch } from "../helper";

export const checkThemeLimit = async (user: any, requestedThemeIds: string[] = []) => {
    if (user.role === ACCOUNT_TYPE.ADMIN) return { allowed: true };

    const userData: any = await getFirstMatch(userModel, { _id: user._id, isDeleted: { $ne: true } }, {}, {});
    if (!userData || !userData.subscription?.planId) {
        return { allowed: false, message: "Active subscription required." };
    }

    const plan: any = await getFirstMatch(planModel, { _id: userData.subscription.planId, isDeleted: { $ne: true } }, {}, {});
    if (!plan) return { allowed: false, message: "Subscription plan not found." };

    // Count unique themes across all user's stores
    const stores = await storeModel.find({ userId: user._id, isDeleted: { $ne: true } });
    const currentThemeIds = new Set<string>();
    stores.forEach(store => {
        if (store.themeIds) store.themeIds.forEach(id => currentThemeIds.add(id.toString()));
        if (store.themeId) currentThemeIds.add(store.themeId.toString());
    });

    // Identify new themes being added
    const newThemes = requestedThemeIds.filter(id => !currentThemeIds.has(id.toString()));
    const totalAfterAddition = currentThemeIds.size + newThemes.length;

    if (totalAfterAddition > plan.themeLimit) {
        return {
            allowed: false,
            message: `Theme limit reached. Your ${plan.name} plan allows up to ${plan.themeLimit} themes. Currently using ${currentThemeIds.size}. Please upgrade to access more.`,
            limit: plan.themeLimit,
            current: currentThemeIds.size
        };
    }

    return { allowed: true };
};
