import type { ChatResult, Message } from "../types";

export function appendLoreUserMessage(
  messages: Message[],
  question: string,
  id = crypto.randomUUID(),
): Message[] {
  return [
    ...messages,
    {
      id,
      role: "user",
      text: question,
    },
  ];
}

export function appendLoreAssistantMessage(
  messages: Message[],
  result: ChatResult,
  id = crypto.randomUUID(),
): Message[] {
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

export function loreModeLabel(mode: string) {
  if (mode === "openai") return "AI configured";
  if (mode === "extractive-server") return "Extractive library";
  if (mode === "extractive-demo") return "Sample library";
  if (mode === "service-unavailable") return "Service unavailable";
  return mode || "Lore service";
}
