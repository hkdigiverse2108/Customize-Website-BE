import { HTTP_STATUS } from "../../common";
import { 
  componentModel, 
  storeModel, 
  storeSettingModel, 
  themeSettingModel, 
  seoSettingModel, 
  visualSettingModel, 
  regionSettingModel 
} from "../../database";
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

    // 1. Fetch Store
    const store: any = await getFirstMatch(storeModel, { slug: val.slug, isDeleted: false, isActive: true }, {}, {});
    if (!store) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));

    const storeId = store._id;

    // 2. Fetch Modular Settings (in parallel for performance)
    const [storeSetting, themeSetting, seoSetting, visualSetting, regionSetting] = await Promise.all([
      storeSettingModel.findOne({ storeId, isDeleted: false }),
      themeSettingModel.findOne({ storeId, isPublished: true, isDeleted: false }).populate("themeId"),
      seoSettingModel.findOne({ storeId, isDeleted: false }),
      visualSettingModel.findOne({ storeId, isDeleted: false }),
      regionSettingModel.findOne({ storeId, isDeleted: false }),
    ]);

    if (!themeSetting || !themeSetting.themeId) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Active published theme not found for this store", {}, {}));
    }

    const theme: any = themeSetting.themeId;
    
    // 3. Get Layout Structure (Live vs Draft)
    let pageLayout = [];
    if (isPreview && theme.draftLayoutJSON) {
        pageLayout = theme.draftLayoutJSON[val.page] || [];
    } else {
        pageLayout = (theme.layoutJSON && theme.layoutJSON[val.page]) || [];
    }
    
    if (!pageLayout.length) {
      return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Page empty", { 
        themeStyles: theme.styles, 
        themeConfig: themeSetting.themeConfig || {},
        components: [] 
      }, {}));
    }

    const componentIds = pageLayout.map((item: any) => item.componentId);

    // 4. Fetch Base Components & Vendor Overrides
    const [baseCompData, overrideData]: [any[], any[]] = await Promise.all([
      getData(componentModel, { _id: { $in: componentIds }, isDeleted: false }, {}, { lean: true }),
      getData(componentModel, { sourceComponentId: { $in: componentIds }, storeId: storeId, isDeleted: false }, {}, { lean: true })
    ]);

    const overrideMap = new Map(overrideData.map((o: any) => [String(o.sourceComponentId), o]));

    // 5. Resolve Final Payload
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
      store: {
        id: storeId,
        name: storeSetting?.name || store.name,
        logo: storeSetting?.logo || store.logo,
        favicon: visualSetting?.favicon || storeSetting?.favicon,
      },
      theme: {
        id: theme._id,
        name: theme.name,
        styles: theme.styles,
        config: themeSetting.themeConfig || {},
      },
      seo: {
        metaTitle: seoSetting?.metaTitle || store.name,
        metaDescription: seoSetting?.metaDescription || store.description,
        metaKeywords: seoSetting?.metaKeywords || [],
        googleAnalyticsId: seoSetting?.googleAnalyticsId || "",
        facebookPixelId: seoSetting?.facebookPixelId || "",
      },
      region: {
        currency: regionSetting?.currency || "INR",
        currencySymbol: regionSetting?.currencySymbol || "₹",
        timezone: regionSetting?.timezone || "Asia/Kolkata",
      },
      visual: {
        customCSS: visualSetting?.customCSS || "",
        customJS: visualSetting?.customJS || "",
        passwordProtection: visualSetting?.passwordProtection || { enabled: false },
      },
      socialLinks: storeSetting?.socialLinks || store.socialLinks || {},
      components: finalComponents.sort((a: any, b: any) => a.order - b.order),
      isPreview
    };

    if (!isPreview) {
        await cacheService.set(cacheKey, result, 600);
        // Track Background View (Non-blocking)
        trackEvent({ storeId: String(storeId), eventType: 'view', resourceType: 'page', metadata: { page: val.page }, req });
    }
    
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Storefront"), result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
