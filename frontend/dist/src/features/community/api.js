import { apiClient } from "../../shared/http/client.js";
export const communityApi = {
    feed: (signal) => apiClient.get("/community", { signal }),
    createPost: (input) => apiClient.post("/community/posts", input),
    updatePost: (id, input, version) => apiClient.patch(`/community/posts/${encodeURIComponent(id)}`, {
        ...input,
        version,
    }),
    removePost: (id) => apiClient.delete(`/community/posts/${encodeURIComponent(id)}`),
    setReaction: (postId, kind) => apiClient.put(`/community/posts/${encodeURIComponent(postId)}/reaction`, { kind }),
    addComment: (postId, body, parentId) => apiClient.post(`/community/posts/${encodeURIComponent(postId)}/comments`, { body, parentId }),
    removeComment: (commentId) => apiClient.delete(`/community/comments/${encodeURIComponent(commentId)}`),
    moderatePost: (postId, decision, version, reason) => apiClient.post(`/community/posts/${encodeURIComponent(postId)}/moderate`, { decision, version, reason }),
    reportPost: (postId, reason, commentId) => apiClient.post(`/community/posts/${encodeURIComponent(postId)}/reports`, { reason, commentId }),
    resolveReport: (reportId, hide) => apiClient.patch(`/community/reports/${encodeURIComponent(reportId)}`, { hide }),
};
