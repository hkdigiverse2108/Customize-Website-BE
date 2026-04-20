import { getStorefrontPage } from "../storefront";

export const getPublishedSite = async (req, res) => {
    req.query.slug = req.params.storeSlug;
    req.query.page = "home";
    return getStorefrontPage(req, res);
};

export const getPublishedSitePage = async (req, res) => {
    req.query.slug = req.params.storeSlug;
    req.query.page = req.params.pageSlug;
    return getStorefrontPage(req, res);
};