import { productModel, blogModel, orderModel, discountModel, storeModel, userLimitModel } from "../database";

/**
 * Syncs the real-time usage for a vendor across all their stores.
 */
export const syncUserUsage = async (userId: string) => {
    const stores = await storeModel.find({ userId, isDeleted: { $ne: true } }, { _id: 1 }).lean();
    const storeIds = stores.map(s => s._id);

    if (storeIds.length === 0) {
        return await userLimitModel.findOneAndUpdate(
            { userId },
            { $set: { "usage.products": 0, "usage.blogs": 0, "usage.orders": 0, "usage.offers": 0, "usage.themes": 0, lastSyncAt: new Date() } },
            { upsert: true, new: true }
        );
    }

    const [products, blogs, orders] = await Promise.all([
        productModel.countDocuments({ storeId: { $in: storeIds }, isDeleted: false }),
        blogModel.countDocuments({ storeId: { $in: storeIds }, isDeleted: false }),
        orderModel.countDocuments({ storeId: { $in: storeIds }, isDeleted: false }),
    ]);

    const storesWithThemes: any = await storeModel.find({ _id: { $in: storeIds } }, { themeIds: 1 }).lean();
    const uniqueThemes = new Set();
    storesWithThemes.forEach((s: any) => {
        if (Array.isArray(s.themeIds)) {
            s.themeIds.forEach((t: any) => uniqueThemes.add(t.toString()));
        }
    });

    const updatedUsage = {
        products,
        blogs,
        orders,
        themes: uniqueThemes.size
    };

    return await userLimitModel.findOneAndUpdate(
        { userId },
        { $set: { usage: updatedUsage, lastSyncAt: new Date() } },
        { upsert: true, new: true }
    );
};

/**
 * Increments or decrements usage for a specific resource.
 */
export const updateResourceUsage = async (userId: string, resource: 'products' | 'blogs' | 'orders' | 'themes', delta: number) => {
    return await userLimitModel.findOneAndUpdate(
        { userId },
        { $inc: { [`usage.${resource}`]: delta } },
        { upsert: true, new: true }
    );
};
