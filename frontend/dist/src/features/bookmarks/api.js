import { apiClient } from "../../shared/http/client.js";
export const bookmarkApi = {
    listCommunityPosts: (signal) => apiClient.get("/community/bookmarks", {
        signal,
    }),
    setCommunityPost: (postId, bookmarked) => apiClient.put(`/community/posts/${encodeURIComponent(postId)}/bookmark`, { bookmarked }),
    listContents: (signal) => apiClient.get("/bookmarks", { signal }),
    setContent: (contentId, bookmarked) => apiClient.put(`/contents/${encodeURIComponent(contentId)}/bookmark`, { bookmarked }),
};
