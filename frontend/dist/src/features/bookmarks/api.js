import { apiClient } from "../../shared/http/client.js";
export const bookmarkApi = {
    // Community bookmark contracts were introduced in Chunk 3 and remain TBD.
    listCommunityPosts: (signal) => apiClient.get("/community/bookmarks", {
        signal,
    }),
    setCommunityPost: (postId, bookmarked) => apiClient.put(`/community/posts/${encodeURIComponent(postId)}/bookmark`, { bookmarked }),
    // Chunk 5 catalog reading-list contracts. The current Flask backend does
    // not implement these routes yet; see FRONTEND_BACKEND_CONTRACT.md.
    listContents: (signal) => apiClient.get("/bookmarks", { signal }),
    setContent: (contentId, bookmarked) => apiClient.put(`/contents/${encodeURIComponent(contentId)}/bookmark`, { bookmarked }),
};
