import { type UploadedFile } from "@/components/FileUpload";

export interface ModelCapabilities {
  id: string;
  capabilities: string[];
}

// Model capabilities mapping
export const MODEL_CAPABILITIES: Record<string, string[]> = {
  "Llama-3.2-1B-Instruct-q4f32_1-MLC": ["text"],
  "Llama-3.2-3B-Instruct-q4f32_1-MLC": ["text"],
  "Phi-3.5-mini-instruct-q4f16_1-MLC": ["text"],
  "Phi-3.5-vision-instruct-q4f32_1-MLC": ["text", "vision", "document"],
  "Llama-3-8B-Instruct-q4f16_1-MLC": ["text"],
};

/**
 * Determines the best model for uploaded files
 * Returns the model ID that should be used
 */
export function getRecommendedModelForFiles(files: UploadedFile[]): string | null {
  if (!files || files.length === 0) return null;

  const hasImages = files.some(f => f.type === "image");
  const hasDocuments = files.some(f => f.type === "document");

  // If user uploaded images or documents, recommend vision model
  if (hasImages || hasDocuments) {
    return "Phi-3.5-vision-instruct-q4f32_1-MLC";
  }

  return null;
}

/**
 * Check if current model supports the file types being uploaded
 */
export function doesModelSupportFiles(
  modelId: string,
  files: UploadedFile[]
): boolean {
  const capabilities = MODEL_CAPABILITIES[modelId] || ["text"];
  
  const hasImages = files.some(f => f.type === "image");
  const hasDocuments = files.some(f => f.type === "document");

  if (hasImages && !capabilities.includes("vision")) {
    return false;
  }

  if (hasDocuments && !capabilities.includes("document")) {
    return false;
  }

  return true;
}

/**
 * Get user-friendly message about model capability mismatch
 */
export function getModelMismatchMessage(
  currentModelId: string,
  files: UploadedFile[]
): string {
  const hasImages = files.some(f => f.type === "image");
  const hasDocuments = files.some(f => f.type === "document");

  if (hasImages && hasDocuments) {
    return "The current model doesn't support images and documents. Switch to Phi-3.5 Vision to analyze these files.";
  } else if (hasImages) {
    return "The current model doesn't support images. Switch to Phi-3.5 Vision to analyze images.";
  } else if (hasDocuments) {
    return "The current model doesn't support documents. Switch to Phi-3.5 Vision to analyze documents.";
  }

  return "The current model doesn't support these file types.";
}

/**
 * Check if a model supports multimodal content
 */
export function isMultimodalModel(modelId: string): boolean {
  const capabilities = MODEL_CAPABILITIES[modelId] || ["text"];
  return capabilities.includes("vision") || capabilities.includes("document");
}

/**
 * Get all models that support specific capabilities
 */
export function getModelsWithCapability(capability: string): string[] {
  return Object.entries(MODEL_CAPABILITIES)
    .filter(([_, caps]) => caps.includes(capability))
    .map(([id]) => id);
}
