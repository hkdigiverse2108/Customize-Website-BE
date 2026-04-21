import { HTTP_STATUS, PAYMENT_FOR, PLAN_DURATION, SUBSCRIPTION_STATUS } from "../common";
import { orderModel, planModel, themeModel, userModel } from "../database";
import { getFirstMatch, updateData, verifyStoreAccess } from "../helper";
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
        return { paymentFor: PAYMENT_FOR.PLAN_SUBSCRIPTION, amount: plan.price, plan, message: `Plan Subscription: ${plan.name} (${plan.duration})` };
    }

    if (value.themeId) {
        const theme: any = await getFirstMatch(themeModel, { _id: value.themeId, isDeleted: { $ne: true } }, {}, {});
        if (!theme) {
            return { errorResponse: res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Theme not found", {}, {})) };
        }
        // Assuming theme price is fixed or fetched from somewhere else for now, 
        // but as it's not in the model yet, we'll return an error or handle it if we find where the price is.
        return { errorResponse: res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Theme purchase not fully implemented", {}, {})) };
    }

    return { errorResponse: res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Invalid payment request: orderId or planId required", {}, {})) };
};

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

    return await updateData(userModel, { _id: userId }, { subscription }, { new: true });
};
