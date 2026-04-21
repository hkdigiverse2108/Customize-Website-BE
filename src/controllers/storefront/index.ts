import { HTTP_STATUS } from "../../common";
import { componentModel, storeModel } from "../../database";
import { cacheService, getFirstMatch, getData, reqInfo, responseMessage, validate, trackEvent } from "../../helper";
import { apiResponse } from "../../type";
import Joi from "joi";

const storefrontPageQuerySchema = Joi.object({
  slug: Joi.string().required(), // store slug
  page: Joi.string().valid("home", "product", "cart", "collection").default("home"),
  isPreview: Joi.boolean().default(false), // Preview mode for builders
});

export const getStorefrontPage = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(storefrontPageQuerySchema, req.query, res);
    if (!val) return;

    const isPreview = val.isPreview;
    const cacheKey = `storefront_${val.slug}_${val.page}_${isPreview ? 'preview' : 'live'}`;
    
    // Only cache live pages
    if (!isPreview) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", cached, {}));
    }

    // 1. Fetch Store and Active Theme
    const store: any = await getFirstMatch(storeModel, { slug: val.slug, isDeleted: false, isActive: true }, {}, { populate: "themeIds" });
    if (!store) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));

    const theme = store.themeIds?.[0];
    if (!theme) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Active theme not found", {}, {}));

    // 2. Get Layout Structure (Live vs Draft)
    let pageLayout = [];
    if (isPreview && theme.draftLayoutJSON) {
        pageLayout = theme.draftLayoutJSON[val.page] || [];
    } else {
        pageLayout = (theme.layoutJSON && theme.layoutJSON[val.page]) || [];
    }
    
    if (!pageLayout.length) return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Page empty", { themeStyles: theme.styles, components: [] }, {}));

    const componentIds = pageLayout.map((item: any) => item.componentId);

    // 3. Fetch Base Components & Vendor Overrides
    const [baseCompData, overrideData]: [any[], any[]] = await Promise.all([
      getData(componentModel, { _id: { $in: componentIds }, isDeleted: false }, {}, { lean: true }),
      getData(componentModel, { sourceComponentId: { $in: componentIds }, storeId: store._id, isDeleted: false }, {}, { lean: true })
    ]);

    const overrideMap = new Map(overrideData.map((o: any) => [String(o.sourceComponentId), o]));

    // 4. Resolve Final Payload
    const finalComponents = pageLayout.map((layoutItem: any) => {
      const baseComp = baseCompData.find((c: any) => String(c._id) === String(layoutItem.componentId));
      const overrideComp = overrideMap.get(String(layoutItem.componentId));

      if (!baseComp && !overrideComp) return null;

      const base = baseComp || {};
      const override = overrideComp || {};

      // If preview mode, prefer draftConfigJSON
      const baseConfig = (isPreview && base.draftConfigJSON) ? base.draftConfigJSON : (base.configJSON || {});
      const overrideConfig = (isPreview && override.draftConfigJSON) ? override.draftConfigJSON : (override.configJSON || {});

      return {
        ...base,
        ...override,
        order: layoutItem.order,
        configJSON: {
          ...baseConfig,
          ...overrideConfig,
          ...(layoutItem.config || {})
        }
      };
    }).filter(Boolean);

    const result = {
      storeName: store.name,
      themeStyles: theme.styles,
      externalScripts: store.externalScripts || [],
      socialLinks: store.socialLinks || {},
      components: finalComponents.sort((a: any, b: any) => a.order - b.order),
      isPreview
    };

    if (!isPreview) {
        await cacheService.set(cacheKey, result, 600);
        // Track Background View (Non-blocking)
        trackEvent({ storeId: String(store._id), eventType: 'view', resourceType: 'page', metadata: { page: val.page }, req });
    }
    
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Storefront"), result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
