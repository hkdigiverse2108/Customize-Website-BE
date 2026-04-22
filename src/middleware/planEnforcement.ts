import { HTTP_STATUS, SUBSCRIPTION_STATUS } from "../common";
import { productModel, blogModel, orderModel, domainSettingModel, storeModel } from "../database";
import { apiResponse } from "../type";

export const checkPlanLimit = (resourceType: 'products' | 'blogs' | 'orders' | 'domains' | 'themes') => {
  return async (req: any, res: any, next: any) => {
    try {
      const user = req.headers.user as any;
      if (!user || !user.subscription || !user.subscription.planId) {
          // If no plan, only allow very basic access or default to free limits logic
          // For now, assume planId is populated correctly in auth middleware
          return next();
      }

      const { planId, status } = user.subscription;
      
      if (status !== SUBSCRIPTION_STATUS.ACTIVE) {
          return res.status(HTTP_STATUS.PAYMENT_REQUIRED).json(apiResponse(HTTP_STATUS.PAYMENT_REQUIRED, "Your subscription is not active. Please renew your plan.", {}, {}));
      }

      const plan = user.subscription.planId as any; // Populated in auth middleware
      const storeId = req.body.storeId || req.query.storeId || req.params.storeId;

      if (!storeId) return next();

      let currentCount = 0;
      let limit = 0;

      switch (resourceType) {
        case 'products':
          currentCount = await productModel.countDocuments({ storeId, isDeleted: false });
          limit = plan.productLimit;
          break;
        case 'blogs':
          currentCount = await blogModel.countDocuments({ storeId, isDeleted: false });
          limit = plan.blogLimit;
          break;
        case 'orders':
          // Usually orders are not blocked from being created, but maybe limited in some SaaS
          currentCount = await orderModel.countDocuments({ storeId, isDeleted: false });
          limit = plan.orderLimit;
          break;
        case 'domains':
          if (!plan.customDomainSupport) {
              return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, "Your current plan does not support custom domains. Please upgrade.", {}, {}));
          }
          return next();
        case 'themes':
          const storeForThemes: any = await storeModel.findOne({ _id: storeId, isDeleted: { $ne: true } }, { themeIds: 1 }, { lean: true });
          currentCount = Array.isArray(storeForThemes?.themeIds)
            ? new Set(storeForThemes.themeIds.map((themeId: any) => String(themeId))).size
            : 0;
          limit = plan.themeLimit;
          break;
      }

      if (limit !== -1 && currentCount >= limit) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, `You have reached the ${resourceType} limit for your plan (${limit}). Please upgrade to add more.`, {}, {}));
      }

      next();
    } catch (error) {
      console.error("Plan limit check failed:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Error checking plan limits", {}, error));
    }
  };
};
