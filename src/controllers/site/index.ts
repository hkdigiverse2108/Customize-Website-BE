import { createHash } from "crypto";
import { isValidObjectId } from "../../common";
import {componentModel,pageModel,settingModel,siteSnapshotModel,storeModel,themeModel,} from "../../database";
import { reqInfo, } from "../../helper";
import { apiResponse } from "../../type";


const toPositiveInt = (v: any, f: number) => {
  const n = Number(v);
  return !Number.isFinite(n) || n <= 0 ? f : Math.floor(n);
};

const SITE_CACHE_TTL_MS = toPositiveInt(process.env.SITE_CACHE_TTL_SECONDS, 60) * 1000;
const SITE_SNAPSHOT_TTL_MS = toPositiveInt(process.env.SITE_SNAPSHOT_TTL_SECONDS, 600) * 1000;
const SITE_CACHE_MAX_SIZE = toPositiveInt(process.env.SITE_CACHE_MAX_SIZE, 500);

const siteMemoryCache = new Map<string, { expiresAt: number; payload: any }>();


const cache = {
  key: (type: "home" | "page", store: string, page = "") => `${type}:${store}:${page}`,

  get: (k: string) => {
    const e = siteMemoryCache.get(k);
    if (!e || e.expiresAt < Date.now()) {
      siteMemoryCache.delete(k);
      return null;
    }
    return e.payload;
  },

  set: (k: string, payload: any) => {
    siteMemoryCache.set(k, { payload, expiresAt: Date.now() + SITE_CACHE_TTL_MS });

    if (siteMemoryCache.size > SITE_CACHE_MAX_SIZE) {
      const sorted = [...siteMemoryCache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      siteMemoryCache.delete(sorted[0][0]);
    }
  },
};

const ts = (v: any) => (v ? new Date(v).getTime() || 0 : 0);

const isPublic = (p: any) => String(p?.visibility || "public") === "public";

const buildSignature = (store: any, setting: any, theme: any, page: any, pages: any[]) => {
  const fingerprint = pages
    .map((p) => [p._id, ts(p.updatedAt), p.visibility, +p.isPublished, +p.isDraft].join(":"))
    .join("|");

  return createHash("sha1")
    .update(
      [
        store._id,
        ts(store.updatedAt),
        setting?._id,
        ts(setting?.updatedAt),
        theme?._id,
        ts(theme?.updatedAt),
        page?._id,
        ts(page?.updatedAt),
        fingerprint,
      ].join("::")
    )
    .digest("hex");
};

const findStore = (slug: string) =>storeModel.findOne({isDeleted: { $ne: true },isActive: true,isPublished: true,$or: [{ slug }, { subdomain: slug }, { customDomain: slug }],},{},{ lean: true });

const getTheme = async (store: any, setting: any) => {
  const ids = [setting?.themeId, ...(store?.themeIds || [])].filter((id) => isValidObjectId(id));
  for (const id of ids) {
    const t = await themeModel.findOne({ _id: id, isActive: true, isDeleted: { $ne: true } }, {}, { lean: true });
    if (t) return t;
  }
  return null;
};

const accessCheck = (page: any, password?: string) => {
  if (!page) return { ok: false, status: 404, msg: "Page not found" };
  if (page.visibility === "private") return { ok: false, status: 403, msg: "Access denied" };
  if (page.visibility === "password" && page.password !== password)
    return { ok: false, status: 401, msg: "Invalid password" };
  return { ok: true };
};

const deepMerge = (a: any = {}, b: any = {}) => {
  const out = { ...a };
  for (const k in b) out[k] = typeof b[k] === "object" ? deepMerge(out[k], b[k]) : b[k];
  return out;
};

const getComponents = async (page: any, theme: any) => {
  const ids = new Set<string>();

  const walk = (n: any) => {
    if (!n) return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (typeof n !== "object") return;

    if (n.componentId && isValidObjectId(n.componentId)) ids.add(n.componentId);
    Object.values(n).forEach(walk);
  };

  walk(page.layoutJSON);

  const linked = ids.size
    ? await componentModel.find({ _id: { $in: [...ids] }, isActive: true, isDeleted: { $ne: true } }, {}, { lean: true })
    : [];

  return linked;
};


const getSnapshot = (storeId: any, pageId: any, type: any, sig: string) =>
  siteSnapshotModel
    .findOne({ storeId, pageId, routeType: type, signature: sig, expiresAt: { $gt: new Date() } }, { payload: 1 })
    .lean();

const saveSnapshot = (type: any, store: any, page: any, sig: string, payload: any, slug = "") =>
  siteSnapshotModel.findOneAndUpdate(
    { storeId: store._id, pageId: page._id, routeType: type, signature: sig },
    {
      $set: {
        payload,
        expiresAt: new Date(Date.now() + SITE_SNAPSHOT_TTL_MS),
        storeSlug: store.slug,
        pageSlug: slug || page.slug,
      },
    },
    { upsert: true }
  );


const handleSite = async ({ type, storeSlug, pageSlug = "", password = "" }: any) => {
  const key = cache.key(type, storeSlug, pageSlug);

  const mem = cache.get(key);
  if (mem) return mem;

  const store: any = await findStore(storeSlug);
  if (!store) throw { status: 404, msg: "Store not found" };

  const setting: any = await settingModel.findOne({ storeId: store._id }, {}, { lean: true });
  const theme = await getTheme(store, setting);
  const pages: any[] = await pageModel.find({ storeId: store._id, isPublished: true, isDeleted: { $ne: true } }).lean();

  const page =
    type === "home"
      ? pages.find((p) => p.isHomePage) || pages[0]
      : pages.find((p) => p.slug === pageSlug);

  const access = accessCheck(page, password);
  if (!access.ok) throw access;

  const canCache = isPublic(page);
  let sig = "";

  if (canCache) {
    sig = buildSignature(store, setting, theme, page, pages);
    const snap = await getSnapshot(store._id, page._id, type, sig);
    if (snap?.payload) {
      cache.set(key, snap.payload);
      return snap.payload;
    }
  }

  const components = await getComponents(page, theme);

  const payload = {
    store,
    theme,
    designSystem: deepMerge(theme?.defaultConfig, deepMerge(store?.themeConfig, setting?.themeConfig)),
    page,
    pages,
    components,
  };

  if (canCache) {
    cache.set(key, payload);
    await saveSnapshot(type, store, page, sig, payload, pageSlug);
  }

  return payload;
};


export const getPublishedSite = async (req, res) => {
  reqInfo(req);
  try {
    const data = await handleSite({
      type: "home",
      storeSlug: req.params.storeSlug?.toLowerCase(),
      password: req.query?.password,
    });

    return res.status(200).json(apiResponse(200, "Site", data, {}));
  } catch (e: any) {
    return res.status(e.status || 500).json(apiResponse(e.status || 500, e.msg || "Error", {}, e));
  }
};

export const getPublishedSitePage = async (req, res) => {
  reqInfo(req);
  try {
    const data = await handleSite({
      type: "page",
      storeSlug: req.params.storeSlug?.toLowerCase(),
      pageSlug: req.params.pageSlug?.toLowerCase(),
      password: req.query?.password,
    });

    return res.status(200).json(apiResponse(200, "Page", data, {}));
  } catch (e: any) {
    return res.status(e.status || 500).json(apiResponse(e.status || 500, e.msg || "Error", {}, e));
  }
};