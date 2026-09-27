// Compatibility facade. The single HTTP implementation now lives in shared/http/client.
// Existing Community/Giveaway/Lore imports stay stable during incremental refactoring.
export { API_BASE_URL, ApiError, api, apiClient, clearCsrf, json, serverMode, } from "../shared/http/client.js";
