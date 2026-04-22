import { HTTP_STATUS, PAYMENT_FOR, PLAN_DURATION, SUBSCRIPTION_STATUS } from "../common";
import { orderModel, planModel, storeModel, themeModel, userModel, userLimitModel, productModel, blogModel, discountModel } from "../database";
import { checkThemeLimit, getFirstMatch, updateData, verifyStoreAccess, validatePlanSwitch } from "../helper";
import { apiResponse } from "../type";

export const resolvePaymentContext = async (value: any, user: any, res: any) => {
    if (value.orderId) {
        const order: any = await getFirstMatch(orderModel, { _id: value.orderId, isDeleted: { $ne: true } }, {}, {});
        if (!order) {
            return { errorResponse: res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Order not found", {}, {})) };
        }
        if (!await verifyStoreAccess(user, order.storeId)) {
            return { errorResponse: res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, "Access denied", {}, {})) };
        }
        return { paymentFor: PAYMENT_FOR.ORDER_PURCHASE, amount: order.totalPrice, order, message: `Order #${order.orderNumber}` };
    }

    if (value.planId) {
        const plan: any = await getFirstMatch(planModel, { _id: value.planId, isDeleted: { $ne: true } }, {}, {});
        if (!plan) {
            return { errorResponse: res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Plan not found", {}, {})) };
        }

        const switchValidation = await validatePlanSwitch(user, value.planId);
        if (!switchValidation.allowed) {
            return { errorResponse: res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, switchValidation.message, switchValidation, {})) };
        }

        return { paymentFor: PAYMENT_FOR.PLAN_SUBSCRIPTION, amount: plan.price, plan, message: `Plan Subscription: ${plan.name} (${plan.duration})` };
    }

    if (value.themeId) {
        if (!value.storeId) {
            return { errorResponse: res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "storeId is required for theme purchase", {}, {})) };
        }

        if (!await verifyStoreAccess(user, value.storeId)) {
            return { errorResponse: res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, "Access denied to store", {}, {})) };
        }

        const store: any = await getFirstMatch(storeModel, { _id: value.storeId, isDeleted: { $ne: true } }, {}, {});
        if (!store) {
            return { errorResponse: res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {})) };
        }

        const theme: any = await getFirstMatch(themeModel, { _id: value.themeId, isDeleted: { $ne: true } }, {}, {});
        if (!theme) {
            return { errorResponse: res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Theme not found", {}, {})) };
        }

        const alreadyOwned = Array.isArray(store.themeIds) && store.themeIds.some((id: any) => String(id) === String(value.themeId));
        if (alreadyOwned) {
            return { errorResponse: res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, "This store already owns this theme.", {}, {})) };
        }

        const themeCheck = await checkThemeLimit(user, [value.themeId], { storeId: value.storeId, mode: "append" });
        if (themeCheck.allowed === false) {
            return { errorResponse: res.status(HTTP_STATUS.PAYMENT_REQUIRED).json(apiResponse(HTTP_STATUS.PAYMENT_REQUIRED, themeCheck.message, themeCheck, {})) };
        }

        return { paymentFor: PAYMENT_FOR.THEME_PURCHASE, amount: theme.price, theme, message: `Theme Purchase: ${theme.name}` };
    }

    return { errorResponse: res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Invalid payment request: orderId or planId required", {}, {})) };
};

export const requiresGlobalPaymentSetting = (paymentFor: PAYMENT_FOR) => {
    return paymentFor === PAYMENT_FOR.PLAN_SUBSCRIPTION || paymentFor === PAYMENT_FOR.THEME_PURCHASE;
};

import { syncUserUsage } from "./limitHelper";

export const applySubscription = async (userId: string, planId: string) => {
    const plan: any = await getFirstMatch(planModel, { _id: planId, isDeleted: { $ne: true } }, {}, {});
    if (!plan) return null;

    const startDate = new Date();
    const endDate = new Date();
    if (plan.duration === PLAN_DURATION.MONTHLY) {
        endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.duration === PLAN_DURATION.YEARLY) {
        endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = {
        planId: plan._id,
        type: plan.name,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate,
        endDate,
        autoRenew: true
    };

    // 1. Sync usage before calculating new limits
    let userLimits: any = await syncUserUsage(userId);
    if (!userLimits) {
        userLimits = await userLimitModel.create({ userId });
    }

    // 2. Prepare new limits based on additive vs replacement rules
    const newLimitsData: any = {
        // Replacement (Reset to Plan Value)
        "limits.themes": plan.themeLimit,
        "limits.products": plan.productLimit,
        "limits.blogs": plan.blogLimit,
        "limits.customDomainSupport": plan.customDomainSupport,

        // Additive (Remaining + New)
        "limits.orders": plan.orderLimit === -1 ? -1 : (Math.max(0, userLimits.limits.orders - userLimits.usage.orders) + plan.orderLimit),
    };

    // Handle Unlimited Cases
    if (plan.productLimit === -1) newLimitsData["limits.products"] = -1;
    if (plan.blogLimit === -1) newLimitsData["limits.blogs"] = -1;
    if (plan.themeLimit === -1) newLimitsData["limits.themes"] = -1;

    await userLimitModel.findOneAndUpdate({ userId }, { $set: newLimitsData }, { upsert: true, new: true });

    return await updateData(userModel, { _id: userId }, { subscription }, { new: true });
};

export const grantTheme = async (storeId: string, themeId: string) => {
    if (!storeId || !themeId) return null;

    return await storeModel.updateOne(
        { _id: storeId, isDeleted: { $ne: true } },
        { $addToSet: { themeIds: themeId } }
    );
};
