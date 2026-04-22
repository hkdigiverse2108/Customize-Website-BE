type ResolveRequestDomainOptions = {
  includeHost?: boolean;
};

type RequestHeadersLike = Record<string, string | string[] | undefined> & {
  host?: string | string[];
  origin?: string | string[];
  referer?: string | string[];
  "x-forwarded-host"?: string | string[];
};

type RequestLike = {
  headers?: RequestHeadersLike;
};

const normalizeDomainValue = (value: unknown) => {
  if (value === null || value === undefined) return "";

  const firstValue = Array.isArray(value) ? value[0] : value;
  if (firstValue === null || firstValue === undefined) return "";

  let normalized = String(firstValue).trim().toLowerCase();
  if (!normalized || normalized === "null" || normalized === "undefined") return "";

  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(normalized)) {
      normalized = new URL(normalized).hostname.toLowerCase();
    }
  } catch {
    // Ignore malformed URLs and fall back to string cleanup below.
  }

  normalized = normalized.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  normalized = normalized.split("/")[0];
  normalized = normalized.split("?")[0];
  normalized = normalized.split("#")[0];
  normalized = normalized.replace(/:\d+$/, "");

  return normalized.trim().toLowerCase();
};

export const resolveRequestDomain = (req: RequestLike, explicitDomain?: string | null, options: ResolveRequestDomainOptions = {}) => {
  const candidates = [
    explicitDomain,
    req?.headers?.["x-forwarded-host"],
    req?.headers?.origin,
    req?.headers?.referer,
    options.includeHost ? req?.headers?.host : null,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeDomainValue(candidate);
    if (normalized) return normalized;
  }

  return "";
};

export const normalizeDomain = normalizeDomainValue;
