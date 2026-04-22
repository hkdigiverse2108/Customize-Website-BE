import { HTTP_STATUS, SUBSCRIPTION_STATUS } from "../common";
import { userLimitModel } from "../database";
import { apiResponse } from "../type";
import { syncUserUsage } from "../helper/limitHelper";

export const checkPlanLimit = (resourceType: 'products' | 'blogs' | 'orders' | 'domains' | 'themes') => {
  return async (req: any, res: any, next: any) => {
    try {
      const user = req.headers.user as any;

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(apiResponse(HTTP_STATUS.UNAUTHORIZED, "User not found.", {}, {}));
      }

      if (user.role === 'admin') return next();

      const { status } = user.subscription;
      
      if (status !== SUBSCRIPTION_STATUS.ACTIVE) {
        return res.status(HTTP_STATUS.PAYMENT_REQUIRED).json(apiResponse(HTTP_STATUS.PAYMENT_REQUIRED, "Your subscription is not active. Please renew your plan.", {}, {}));
      }

      // Fetch centralized limits and usage
      let userLimits: any = await userLimitModel.findOne({ userId: user._id });

      // Fallback: Sync usage and limits if not found
      if (!userLimits) {
        userLimits = await syncUserUsage(user._id);
      }

      if (!userLimits) return next();

      let currentCount = 0;
      let limit = 0;

      // Use cached usage data from UserLimit model (Scalable & Efficient)
      switch (resourceType) {
        case 'products':
          currentCount = userLimits.usage?.products || 0;
          limit = userLimits.limits?.products ?? 0;
          break;
        case 'blogs':
          currentCount = userLimits.usage?.blogs || 0;
          limit = userLimits.limits?.blogs ?? 0;
          break;
        case 'orders':
          currentCount = userLimits.usage?.orders || 0;
          limit = userLimits.limits?.orders ?? 0;
          break;
        case 'domains':
          if (!userLimits.limits?.customDomainSupport) {
            return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, "Your current plan does not support custom domains. Please upgrade.", {}, {}));
          }
          return next();
        case 'themes':
          currentCount = userLimits.usage?.themes || 0;
          limit = userLimits.limits?.themes ?? 0;
          break;
      }

      if (limit !== -1 && currentCount >= limit) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, `Limit reached for ${resourceType}. Please upgrade your plan.`, {}, {}));
      }

      return next();
    } catch (error) {
      console.error("Plan Enforcement Error:", error);
      return next();
    }
  };
};

