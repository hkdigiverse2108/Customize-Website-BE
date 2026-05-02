import { HTTP_STATUS } from "../../common";
import {
  componentModel,
  domainSettingModel,
  storeModel,
  storeSettingModel,
  themeSettingModel, 
  seoSettingModel, 
  visualSettingModel, 
  regionSettingModel 
} from "../../database";
import { cacheService, getFirstMatch, getData, reqInfo, responseMessage, resolveRequestDomain, trackEvent, validate } from "../../helper";
import { apiResponse } from "../../type";
import { storefrontPageQuerySchema } from "../../validation";
import { THEME_GLOBAL_LAYOUT_SECTIONS } from "../../type/theme";


const mergeSettings = (base: any[] = [], custom: any[] = []) => {
  const merged = new Map();
  
  // Add base settings
  base.forEach(item => {
    if (item && item.key) merged.set(item.key, item);
  });
  
  // Add/Override with custom settings
  custom.forEach(item => {
    if (item && item.key) {
      const existing = merged.get(item.key);
      // If setting exists, merge properties (value, label, etc.), custom overrides base
      merged.set(item.key, existing ? { ...existing, ...item } : item);
    }
  });
  
  return Array.from(merged.values());
};

const mapSettingsToObject = (settings: any[] = []) => {
  const obj: any = {};
  settings.forEach(item => {
    if (item && item.key) {
      // Handle nested keys like "colors.primary"
      const keys = item.key.split('.');
      let current = obj;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (i === keys.length - 1) {
          current[key] = item.value;
        } else {
          current[key] = current[key] || {};
          current = current[key];
        }
      }
    }
  });
  return obj;
};



const getThemeSettingForStore = async (storeId: string, themeId?: string | null) => {
  const filter: any = { storeId, isDeleted: false };
  if (themeId) {
    filter.themeId = themeId;
  } else {
    filter.isPublished = true;
  }

  return themeSettingModel.findOne(filter).populate("themeId");
};

const sortLayoutItems = (items: any[] = []) =>
  [...items].sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0));

const getLayoutItems = (layout: any[] = [], key: string) => {
  const pageLayout = (layout || []).find((p: any) => p.page === key);
  return sortLayoutItems(Array.isArray(pageLayout?.sections) ? pageLayout.sections : []);
};


const resolveStoreWebsite = async (req: any, val: any) => {
  const requestDomain = resolveRequestDomain(req, val.domain, { includeHost: true });
  const domainSetting = requestDomain
    ? await domainSettingModel.findOne({ domain: requestDomain, isDeleted: false }).populate("themeId")
    : null;

  if (domainSetting) {
    const store = await getFirstMatch(storeModel, { _id: domainSetting.storeId, isDeleted: false, isActive: true }, {}, {});
    return { store, domainSetting, requestDomain };
  }

  const slug = String(val.slug || "").trim().toLowerCase();
  const store = slug ? await getFirstMatch(storeModel, { slug, isDeleted: false, isActive: true }, {}, {}) : null;
  return { store, domainSetting: null, requestDomain };
};

export const getStorefrontPage = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(storefrontPageQuerySchema, req.query, res);
    if (!val) return;

    const isPreview = val.isPreview;
    const { store, domainSetting, requestDomain } = await resolveStoreWebsite(req, val);
    if (!store) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));

    const storeId = store._id;
    const resolvedDomainThemeId = ((domainSetting?.themeId as any)?._id || domainSetting?.themeId || null) as any;
    let selectedThemeSetting = await getThemeSettingForStore(
      String(storeId),
      resolvedDomainThemeId ? String(resolvedDomainThemeId) : null
    );
    if (!selectedThemeSetting) {
      selectedThemeSetting = await getThemeSettingForStore(String(storeId));
    }

    if (!selectedThemeSetting || !selectedThemeSetting.themeId) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Active published theme not found for this store", {}, {}));
    }

    const themeSetting = selectedThemeSetting;
    const theme: any = themeSetting.themeId;
    const cacheIdentity = domainSetting?.domain || val.slug || store.slug;
    const themeCacheKey = String((theme as any)?._id || theme);
    const cacheKey = `storefront_${storeId}_${cacheIdentity}_${themeCacheKey}_${val.page}_${isPreview ? 'preview' : 'live'}`;
    
    // Only cache live pages
    if (!isPreview) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", cached, {}));
    }

    // 2. Fetch Modular Settings (in parallel for performance)
    const [storeSetting, seoSetting, visualSetting, regionSetting] = await Promise.all([
      storeSettingModel.findOne({ storeId, isDeleted: false }),
      seoSettingModel.findOne({ storeId, isDeleted: false }),
      visualSettingModel.findOne({ storeId, isDeleted: false }),
      regionSettingModel.findOne({ storeId, isDeleted: false }),
    ]);
    
    // 3. Get Layout Structure (Inheritance: Base Theme -> Vendor Custom Layout)
    const baseLayout = (isPreview && theme.draftLayoutJSON?.length) ? theme.draftLayoutJSON : (theme.layoutJSON || []);
    const vendorLayout = (isPreview && themeSetting.draftLayoutJSON?.length) ? themeSetting.draftLayoutJSON : (themeSetting.customLayoutJSON || []);
    
    // Merge Layout: Vendor layout takes priority if it exists for the page
    const hasVendorPage = Array.isArray(vendorLayout) && vendorLayout.some((p: any) => p.page === val.page);
    const layoutSource = hasVendorPage ? vendorLayout : baseLayout;

    const [headerSection, footerSection] = THEME_GLOBAL_LAYOUT_SECTIONS;
    const headerLayout = getLayoutItems(layoutSource, headerSection);
    const pageLayout = getLayoutItems(layoutSource, val.page);
    const footerLayout = getLayoutItems(layoutSource, footerSection);
    const layoutItems = [...headerLayout, ...pageLayout, ...footerLayout];


    if (!layoutItems.length) {
      const mergedStyles = mergeSettings(theme.styles || [], themeSetting.customStyles || []);
      const mergedConfig = mergeSettings(theme.defaultConfig || [], themeSetting.customSettings || []);

      return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Page empty", {
        themeStyles: mergedStyles,
        themeConfig: mergedConfig,
        themeStylesMap: mapSettingsToObject(mergedStyles),
        themeConfigMap: mapSettingsToObject(mergedConfig),
        components: []
      }, {}));
    }


    const componentIds = [...new Set(layoutItems.map((item: any) => item.componentId).filter(Boolean))];

    // 4. Fetch Base Components & Vendor Overrides
    const [baseCompData, overrideData]: [any[], any[]] = await Promise.all([
      getData(componentModel, { _id: { $in: componentIds }, isDeleted: false }, {}, { lean: true }),
      getData(componentModel, { sourceComponentId: { $in: componentIds }, storeId: storeId, isDeleted: false }, {}, { lean: true })
    ]);

    const overrideMap = new Map(overrideData.map((o: any) => [String(o.sourceComponentId), o]));

    // 5. Resolve Final Payload
    const resolveLayoutItem = (layoutItem: any) => {
      const baseComp = baseCompData.find((c: any) => String(c._id) === String(layoutItem.componentId));
      const overrideComp = overrideMap.get(String(layoutItem.componentId));

      if (!baseComp && !overrideComp) return null;

      const base = baseComp || {};
      const override = overrideComp || {};

      // If preview mode, prefer draftConfigJSON
      const baseConfig = (isPreview && base.draftConfigJSON) ? base.draftConfigJSON : (base.defaultConfig || []);
      const overrideConfig = (isPreview && override.draftConfigJSON) ? override.draftConfigJSON : (override.configJSON || []);
      const layoutConfig = layoutItem.config || [];

      const mergedConfig = mergeSettings(mergeSettings(baseConfig, overrideConfig), layoutConfig);

      return {
        ...base,
        ...override,
        order: layoutItem.order,
        config: mergedConfig,
        configMap: mapSettingsToObject(mergedConfig)
      };

    };

    const finalComponents = [
      ...headerLayout.map(resolveLayoutItem),
      ...pageLayout.map(resolveLayoutItem),
      ...footerLayout.map(resolveLayoutItem),
    ].filter(Boolean);

    const result = {
      store: {
        id: storeId,
        name: storeSetting?.name || store.name,
        logo: storeSetting?.logo || store.logo,
        banner: storeSetting?.banner || store.banner,
        favicon: mapSettingsToObject(visualSetting?.settings || []).favicon || storeSetting?.favicon || store.logo,
      },

      website: {
        domain: domainSetting?.domain || requestDomain || null,
        isPrimary: domainSetting?.isPrimary || false,
        status: domainSetting?.status || null,
        themeId: String((domainSetting?.themeId as any)?._id || domainSetting?.themeId || (theme as any)?._id || theme),
      },
      theme: {
        id: theme._id,
        name: theme.name,
        styles: mergeSettings(theme.styles || [], themeSetting.customStyles || []),
        config: mergeSettings(theme.defaultConfig || [], themeSetting.customSettings || []),
        stylesMap: mapSettingsToObject(mergeSettings(theme.styles || [], themeSetting.customStyles || [])),
        configMap: mapSettingsToObject(mergeSettings(theme.defaultConfig || [], themeSetting.customSettings || [])),

      },
      breakpoints: theme.breakpoints || {},


      seo: {
        ...mapSettingsToObject(seoSetting?.settings || []),
        metaTitle: mapSettingsToObject(seoSetting?.settings || []).metaTitle || store.name,
        metaDescription: mapSettingsToObject(seoSetting?.settings || []).metaDescription || store.description,
      },
      region: {
        currency: regionSetting?.currency || "INR",
        currencySymbol: regionSetting?.currencySymbol || "₹",
        timezone: regionSetting?.timezone || "Asia/Kolkata",
      },
      visual: {
        ...mapSettingsToObject(visualSetting?.settings || []),
      },

      socialLinks: storeSetting?.socialLinks || store.socialLinks || {},
      components: finalComponents,
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
