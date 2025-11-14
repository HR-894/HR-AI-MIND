import type { Settings } from "@shared/schema";

// Define instruction sets
const lengthInstructions = {
  concise: "Keep your responses brief and to the point.",
  balanced: "Provide balanced responses with appropriate detail.",
  detailed: "Provide comprehensive, detailed responses with thorough explanations.",
};

const toneInstructions = {
  professional: "Maintain a professional, formal tone.",
  friendly: "Be warm, approachable, and friendly.",
  casual: "Use a casual, conversational style.",
  enthusiastic: "Be energetic, enthusiastic, and encouraging!",
  technical: "Use precise technical language and focus on accuracy.",
};

/**
 * Builds the core content of the system prompt, independent of model-specific tags.
 */
function getSystemPromptContent(settings: Settings): string {
  let content = settings.systemPrompt || "You are a helpful, intelligent AI assistant.";

  const lengthGuide = lengthInstructions[settings.responseLength as keyof typeof lengthInstructions] || "";
  const toneGuide = toneInstructions[settings.responseTone as keyof typeof toneInstructions] || "";

  const instructions: string[] = [];
  if (lengthGuide) instructions.push(lengthGuide);
  if (toneGuide) instructions.push(toneGuide);
  if (settings.customInstructions) instructions.push(settings.customInstructions);

  if (instructions.length > 0) {
    content += "\n\n" + instructions.join(" ");
  }
  return content.trim();
}

/**
 * Applies the correct chat template for the given model.
 * Note: web-llm's chat.completions.create usually handles this automatically,
 * but this function provides explicit control for edge cases.
 */
export function applyChatTemplate(
  messages: { role: string; content: string }[],
  modelId: string
): { role: string; content: string }[] {
  // Find the system prompt
  const systemMessage = messages.find((m) => m.role === "system");
  if (!systemMessage) return messages;

  const otherMessages = messages.filter((m) => m.role !== "system");

  // Model-specific templating
  // For most models, web-llm handles this, but we keep this for future customization
  if (modelId.includes("Llama-3")) {
    // Llama 3 uses special tokens, but web-llm handles this internally
    // Keep this structure for potential manual override
    return [systemMessage, ...otherMessages];
  } else if (modelId.includes("Phi-3")) {
    // Phi-3 format - web-llm handles this
    return [systemMessage, ...otherMessages];
  }

  // Default: return as-is
  return [systemMessage, ...otherMessages];
}

export { getSystemPromptContent };
