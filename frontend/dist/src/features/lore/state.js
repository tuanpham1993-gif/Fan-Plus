export function appendLoreUserMessage(messages, question, id = crypto.randomUUID()) {
    return [
        ...messages,
        {
            id,
            role: "user",
            text: question,
        },
    ];
}
export function appendLoreAssistantMessage(messages, result, id = crypto.randomUUID()) {
    return [
        ...messages,
        {
            id,
            role: "assistant",
            text: result.text,
            sources: result.sources,
            mode: result.mode,
        },
    ];
}
export function loreModeLabel(mode) {
    if (mode === "openai")
        return "AI configured";
    if (mode === "extractive-server")
        return "Extractive library";
    if (mode === "extractive-demo")
        return "Sample library";
    if (mode === "service-unavailable")
        return "Service unavailable";
    return mode || "Lore service";
}
