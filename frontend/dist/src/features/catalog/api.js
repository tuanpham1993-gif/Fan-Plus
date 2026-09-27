import { apiClient } from "../../shared/http/client.js";
/**
 * Required backend catalog contract. The current Flask backend does not yet
 * expose these routes; they remain explicit integration gaps until Backend
 * implements/agrees them.
 */
export const CATALOG_ENDPOINTS = {
    categories: "/categories",
    contents: "/contents",
    contentDetail: (id) => `/contents/${encodeURIComponent(id)}`,
    contentRating: (id) => `/contents/${encodeURIComponent(id)}/rating`,
};
export function catalogSearchParams(query) {
    const params = new URLSearchParams();
    if (query.q)
        params.set("q", query.q);
    if (query.category)
        params.set("category", query.category);
    if (query.fandom)
        params.set("fandom", query.fandom);
    if (query.type)
        params.set("type", query.type);
    if (query.genre)
        params.set("genre", query.genre);
    if (query.year)
        params.set("year", query.year);
    if (query.popular)
        params.set("popular", "true");
    if (query.sortBy)
        params.set("sort_by", query.sortBy);
    if (query.page)
        params.set("page", String(query.page));
    if (query.pageSize)
        params.set("page_size", String(query.pageSize));
    return params;
}
export const catalogApi = {
    categories: (signal) => apiClient.get(CATALOG_ENDPOINTS.categories, { signal }),
    contents: (query, signal) => {
        const params = catalogSearchParams(query);
        const suffix = params.size ? `?${params.toString()}` : "";
        return apiClient.get(CATALOG_ENDPOINTS.contents + suffix, {
            signal,
        });
    },
    detail: (id, signal) => apiClient.get(CATALOG_ENDPOINTS.contentDetail(id), {
        signal,
    }),
    rate: (id, value, signal) => apiClient.put(CATALOG_ENDPOINTS.contentRating(id), { value }, { signal }),
};
