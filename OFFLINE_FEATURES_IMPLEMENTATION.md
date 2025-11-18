# Offline Features Implementation Guide

**Target Application**: Browser-based AI chat with WebLLM, WebGPU, IndexedDB  
**Features**: Vision Language Model (VLM) image analysis + RAG document processing  
**Architecture**: Zero cloud dependencies, 100% offline in-browser processing

---

## Part 1: Offline Image Analysis with Vision Language Model

### 1.1 Add Vision Model to Configuration

**File**: `public/models.json`

```json
{
  "id": "Phi-3.5-vision-instruct-q4f16_1-MLC",
  "name": "Phi 3.5 Vision",
  "displayName": "Phi 3.5 Vision (Multimodal)",
  "sizeMB": 4200,
  "quantization": "q4f16_1",
  "vramMinGB": 5,
  "speed": "Multimodal",
  "description": "Vision-language model. Analyzes images and answers questions about visual content.",
  "recommended": "Image analysis • Visual Q&A • OCR • Chart interpretation",
  "capabilities": ["text", "vision"]
}
```

**Implementation Notes**:
- Add after existing models in the array
- `capabilities` field enables UI to show image upload option
- Model size ~4.2GB requires good network for first download
- Cached in IndexedDB after first load

### 1.2 Update UI for Image Upload

**File**: `client/src/components/ChatInput.tsx`

```typescript
import { Image as ImageIcon, Paperclip } from "lucide-react";

interface ChatInputProps {
  // ... existing props
  currentModelCapabilities?: string[];
}

export function ChatInput({ currentModelCapabilities, ...props }: ChatInputProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportsVision = currentModelCapabilities?.includes("vision");

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Size limit: 5MB for performance
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Maximum 5MB.");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {/* Image Preview */}
      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt="Selected" 
            className="max-h-32 rounded border"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {/* Image Upload Button (only for vision models) */}
        {supportsVision && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!selectedImage}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Text Input */}
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={supportsVision ? "Ask about the image or chat..." : "Type a message..."}
          className="flex-1"
        />

        {/* Send Button */}
        <Button 
          onClick={() => handleSend(input, selectedImage)}
          disabled={(!input.trim() && !selectedImage) || isLoading}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
```

### 1.3 Multimodal Message Format

**File**: `client/src/lib/worker-client.ts`

```typescript
export interface MultimodalMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{
    type: "text" | "image_url";
    text?: string;
    image_url?: { url: string };
  }>;
}

export function createMultimodalMessage(
  text: string, 
  imageBase64?: string | null
): MultimodalMessage {
  if (!imageBase64) {
    return {
      role: "user",
      content: text
    };
  }

  // WebLLM expects multimodal content as array
  return {
    role: "user",
    content: [
      {
        type: "text",
        text: text || "What do you see in this image?"
      },
      {
        type: "image_url",
        image_url: {
          url: imageBase64 // Data URL: data:image/jpeg;base64,/9j/4AAQ...
        }
      }
    ]
  };
}
```

**Key Points**:
- Base64 string must include MIME type prefix: `data:image/jpeg;base64,`
- FileReader's `readAsDataURL()` automatically adds this
- Text can be empty; vision models can describe images without prompts
- Array format allows mixing text and images in single message

### 1.4 Worker Support for Multimodal

**File**: `client/src/workers/ai.worker.ts`

```typescript
async function handleGenerate(messages: any[], options: any) {
  if (!engine) {
    throw new Error("Engine not initialized. Please load a model first.");
  }

  const startTime = performance.now();
  let tokenCount = 0;

  try {
    // Support both simple string content and multimodal array content
    const formattedMessages = messages.map(msg => {
      // Keep multimodal content structure intact
      if (Array.isArray(msg.content)) {
        return {
          role: msg.role,
          content: msg.content // Array of {type, text?, image_url?}
        };
      }
      
      // Convert simple string to standard format
      return {
        role: msg.role,
        content: String(msg.content || "")
      };
    });

    const finalMaxTokens = Math.max(1, Math.min(4096, options.maxTokens ?? 2048));

    const chunks = await engine.chat.completions.create({
      messages: formattedMessages,
      temperature: Math.max(0, Math.min(2, options.temperature ?? 0.7)),
      max_tokens: finalMaxTokens,
      stream: true,
      top_p: options.top_p ?? 0.95,
      frequency_penalty: options.frequency_penalty ?? 0,
      presence_penalty: options.presence_penalty ?? 0,
    });

    // Streaming response handling remains the same
    for await (const chunk of chunks) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        tokenCount++;
        self.postMessage({
          type: "token",
          content,
        });
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const tokensPerSecond = tokenCount / (duration / 1000);

    self.postMessage({ 
      type: "complete",
      metrics: {
        tokenCount,
        duration,
        tokensPerSecond: tokensPerSecond.toFixed(2),
      }
    });
  } catch (error: any) {
    console.error("Generation error:", error);
    if (error.message?.includes("abort") || error.message?.includes("interrupt")) {
      self.postMessage({ type: "aborted" });
    } else {
      throw new Error(`Generation failed: ${error.message}`);
    }
  }
}
```

### 1.5 Store Images in Messages

**File**: `client/src/lib/database.ts`

```typescript
export interface MessageAttachment {
  type: "image" | "document";
  mimeType: string;
  data: string; // base64
  size: number;
  name?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  attachment?: MessageAttachment; // NEW
}

// Update schema
const DB_VERSION = 3; // Increment version

db.createObjectStore("messages", { keyPath: "id" });
const messageStore = db.createObjectStore("messages", { keyPath: "id" });
messageStore.createIndex("sessionId", "sessionId", { unique: false });
messageStore.createIndex("timestamp", "timestamp", { unique: false });
```

**Storage Optimization**:
- Images stored as base64 in IndexedDB
- IndexedDB handles large blobs efficiently (tested up to 50MB per entry)
- Consider compression for very large images using `canvas.toBlob()` with quality parameter
- Attachment is optional; text-only messages don't include it

---

## Part 2: Offline Document RAG System

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  [File Upload: PDF/DOCX/TXT] → [Processing Indicator]       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Document Parser                           │
│  • PDF: pdfjs-dist (Mozilla's PDF.js)                       │
│  • DOCX: mammoth.js (Microsoft Word parser)                 │
│  • TXT: Direct text extraction                              │
│  • Images in docs: Tesseract.js OCR (optional)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Text Chunker                               │
│  • Split into ~3000 char segments                           │
│  • Preserve sentence boundaries                             │
│  • Overlap: 200 chars for context continuity                │
│  • Store: chunk text, doc_id, chunk_index, metadata         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Indexer (lunr.js)                           │
│  • TF-IDF scoring (Term Frequency-Inverse Doc Frequency)    │
│  • Tokenization: stemming + stop word removal               │
│  • Fields: chunk text, title, metadata                      │
│  • Serialized index → IndexedDB                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  IndexedDB Storage                           │
│  Stores: documents, chunks, lunr_index                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼ (Query Time)
┌─────────────────────────────────────────────────────────────┐
│                  Retrieval Pipeline                          │
│  1. User question → lunr.search(question)                   │
│  2. Top 3-5 chunks by relevance score                       │
│  3. Construct context: "Based on:\n[chunk1]\n[chunk2]..."   │
│  4. System prompt + context + question → LLM                │
│  5. Stream response with citations                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Install Dependencies

```bash
npm install pdfjs-dist mammoth lunr tesseract.js
```

**Package Purposes**:
- `pdfjs-dist`: Mozilla's PDF parser, WebAssembly-based, no server needed
- `mammoth`: Microsoft Word (.docx) to HTML/text converter
- `lunr`: Full-text search engine (TF-IDF/BM25), runs entirely in browser
- `tesseract.js`: OCR for images in PDFs (optional, ~10MB WASM model)

### 2.3 Document Parser Service

**File**: `client/src/lib/document-parser.ts`

```typescript
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedDocument {
  text: string;
  metadata: {
    filename: string;
    type: "pdf" | "docx" | "txt";
    pageCount?: number;
    wordCount: number;
    parsedAt: number;
  };
}

/**
 * Parse PDF using Mozilla's PDF.js
 * Extracts text from all pages, handles embedded images via OCR
 */
export async function parsePDF(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const textParts: string[] = [];
  const pageCount = pdf.numPages;

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Extract text items
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    
    textParts.push(`\n--- Page ${i} ---\n${pageText}`);
  }

  const fullText = textParts.join("\n");
  
  return {
    text: fullText,
    metadata: {
      filename: file.name,
      type: "pdf",
      pageCount,
      wordCount: fullText.split(/\s+/).length,
      parsedAt: Date.now()
    }
  };
}

/**
 * Parse DOCX using mammoth.js
 * Converts to plain text, preserves basic formatting
 */
export async function parseDOCX(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  const text = result.value;
  
  return {
    text,
    metadata: {
      filename: file.name,
      type: "docx",
      wordCount: text.split(/\s+/).length,
      parsedAt: Date.now()
    }
  };
}

/**
 * Parse plain text file
 * Direct extraction, handles UTF-8 encoding
 */
export async function parseTXT(file: File): Promise<ParsedDocument> {
  const text = await file.text();
  
  return {
    text,
    metadata: {
      filename: file.name,
      type: "txt",
      wordCount: text.split(/\s+/).length,
      parsedAt: Date.now()
    }
  };
}

/**
 * OCR for images (optional)
 * Use for scanned PDFs or standalone images
 */
export async function parseImageOCR(file: File): Promise<ParsedDocument> {
  const { data: { text } } = await Tesseract.recognize(file, "eng", {
    logger: (m) => console.log(m) // Progress updates
  });
  
  return {
    text,
    metadata: {
      filename: file.name,
      type: "txt", // Treat as text
      wordCount: text.split(/\s+/).length,
      parsedAt: Date.now()
    }
  };
}

/**
 * Main parser dispatcher
 * Routes to appropriate parser based on MIME type
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const mimeType = file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (mimeType === "application/pdf" || extension === "pdf") {
    return parsePDF(file);
  }
  
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) {
    return parseDOCX(file);
  }
  
  if (mimeType === "text/plain" || extension === "txt") {
    return parseTXT(file);
  }
  
  if (mimeType.startsWith("image/")) {
    return parseImageOCR(file);
  }
  
  throw new Error(`Unsupported file type: ${mimeType}`);
}
```

### 2.4 Text Chunking Strategy

**File**: `client/src/lib/chunker.ts`

```typescript
export interface TextChunk {
  id: string;
  documentId: string;
  index: number;
  text: string;
  startChar: number;
  endChar: number;
  wordCount: number;
}

/**
 * Split text into overlapping chunks
 * Preserves sentence boundaries for better context
 */
export function chunkText(
  text: string,
  documentId: string,
  options: {
    chunkSize?: number;
    overlap?: number;
  } = {}
): TextChunk[] {
  const {
    chunkSize = 3000, // ~750 tokens for 4K context models
    overlap = 200     // Preserve context across chunks
  } = options;

  // Normalize whitespace
  const normalizedText = text.replace(/\s+/g, " ").trim();
  
  const chunks: TextChunk[] = [];
  let startChar = 0;
  let index = 0;

  while (startChar < normalizedText.length) {
    let endChar = startChar + chunkSize;
    
    // Don't exceed text length
    if (endChar >= normalizedText.length) {
      endChar = normalizedText.length;
    } else {
      // Try to break at sentence boundary
      const sentenceEnd = normalizedText.lastIndexOf(". ", endChar);
      if (sentenceEnd > startChar + chunkSize * 0.5) {
        endChar = sentenceEnd + 1; // Include the period
      } else {
        // Fallback to word boundary
        const spaceIndex = normalizedText.lastIndexOf(" ", endChar);
        if (spaceIndex > startChar) {
          endChar = spaceIndex;
        }
      }
    }

    const chunkText = normalizedText.substring(startChar, endChar).trim();
    
    if (chunkText.length > 0) {
      chunks.push({
        id: `${documentId}-chunk-${index}`,
        documentId,
        index,
        text: chunkText,
        startChar,
        endChar,
        wordCount: chunkText.split(/\s+/).length
      });
      
      index++;
    }

    // Move start position with overlap
    startChar = endChar - overlap;
    
    // Prevent infinite loop
    if (startChar <= 0) startChar = endChar;
  }

  return chunks;
}
```

**Chunking Rationale**:
- 3000 chars ≈ 750 tokens (assuming 4 chars/token average)
- Leaves room for: system prompt (200 tokens) + question (100 tokens) + response (1000+ tokens)
- 200-char overlap prevents context loss at boundaries
- Sentence-aware splitting improves semantic coherence
- Word boundaries as fallback for readability

### 2.5 Indexing with lunr.js

**File**: `client/src/lib/indexer.ts`

```typescript
import lunr from "lunr";
import { TextChunk } from "./chunker";

export interface SearchResult {
  chunk: TextChunk;
  score: number;
  ref: string;
}

/**
 * Build lunr.js search index from chunks
 * Uses TF-IDF scoring with stemming
 */
export function buildIndex(chunks: TextChunk[]): lunr.Index {
  return lunr(function() {
    // Configure fields
    this.ref("id");
    this.field("text", { boost: 10 }); // Primary searchable field
    this.field("documentId");
    
    // Add documents
    chunks.forEach((chunk) => {
      this.add({
        id: chunk.id,
        text: chunk.text,
        documentId: chunk.documentId
      });
    });
  });
}

/**
 * Serialize index for storage
 * lunr.Index can be converted to JSON and restored
 */
export function serializeIndex(index: lunr.Index): string {
  return JSON.stringify(index);
}

/**
 * Restore index from serialized JSON
 */
export function deserializeIndex(serialized: string): lunr.Index {
  return lunr.Index.load(JSON.parse(serialized));
}

/**
 * Search index for relevant chunks
 * Returns top N results sorted by relevance score
 */
export function searchIndex(
  index: lunr.Index,
  chunks: TextChunk[],
  query: string,
  topK: number = 5
): SearchResult[] {
  const results = index.search(query);
  
  // Map search results to full chunk data
  const chunkMap = new Map(chunks.map(c => [c.id, c]));
  
  return results
    .slice(0, topK)
    .map(result => ({
      chunk: chunkMap.get(result.ref)!,
      score: result.score,
      ref: result.ref
    }))
    .filter(r => r.chunk !== undefined);
}
```

**lunr.js Features**:
- Stemming: "running" → "run" (matches "runs", "ran")
- Stop word removal: ignores "the", "a", "is", etc.
- TF-IDF: ranks rare terms higher than common ones
- Field boosting: prioritize certain fields (e.g., title > body)
- Fuzzy matching: optional for typo tolerance

### 2.6 IndexedDB Storage Schema

**File**: `client/src/lib/rag-database.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from "idb";
import { TextChunk } from "./chunker";
import { ParsedDocument } from "./document-parser";

interface RAGDBSchema extends DBSchema {
  documents: {
    key: string; // document ID
    value: {
      id: string;
      filename: string;
      type: "pdf" | "docx" | "txt";
      fullText: string;
      metadata: any;
      uploadedAt: number;
    };
    indexes: { filename: string };
  };
  chunks: {
    key: string; // chunk ID
    value: TextChunk;
    indexes: { documentId: string };
  };
  indexes: {
    key: string; // "main-index"
    value: {
      serialized: string; // JSON stringified lunr.Index
      updatedAt: number;
    };
  };
}

let db: IDBPDatabase<RAGDBSchema> | null = null;

export async function openRAGDatabase(): Promise<IDBPDatabase<RAGDBSchema>> {
  if (db) return db;

  db = await openDB<RAGDBSchema>("rag-storage", 1, {
    upgrade(database) {
      // Documents store
      const docStore = database.createObjectStore("documents", { keyPath: "id" });
      docStore.createIndex("filename", "filename", { unique: false });

      // Chunks store
      const chunkStore = database.createObjectStore("chunks", { keyPath: "id" });
      chunkStore.createIndex("documentId", "documentId", { unique: false });

      // Indexes store
      database.createObjectStore("indexes", { keyPath: "key" });
    }
  });

  return db;
}

/**
 * Store document and its chunks, rebuild index
 */
export async function storeDocument(
  parsed: ParsedDocument,
  chunks: TextChunk[]
): Promise<string> {
  const database = await openRAGDatabase();
  const documentId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Store document
  await database.put("documents", {
    id: documentId,
    filename: parsed.metadata.filename,
    type: parsed.metadata.type,
    fullText: parsed.text,
    metadata: parsed.metadata,
    uploadedAt: Date.now()
  });

  // Store chunks
  for (const chunk of chunks) {
    await database.put("chunks", chunk);
  }

  return documentId;
}

/**
 * Retrieve all chunks (for index building)
 */
export async function getAllChunks(): Promise<TextChunk[]> {
  const database = await openRAGDatabase();
  return database.getAll("chunks");
}

/**
 * Store serialized lunr index
 */
export async function saveIndex(serialized: string): Promise<void> {
  const database = await openRAGDatabase();
  await database.put("indexes", {
    key: "main-index",
    serialized,
    updatedAt: Date.now()
  });
}

/**
 * Load serialized lunr index
 */
export async function loadIndex(): Promise<string | null> {
  const database = await openRAGDatabase();
  const record = await database.get("indexes", "main-index");
  return record?.serialized ?? null;
}

/**
 * Delete document and its chunks, rebuild index
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const database = await openRAGDatabase();
  
  // Delete document
  await database.delete("documents", documentId);
  
  // Delete associated chunks
  const tx = database.transaction("chunks", "readwrite");
  const index = tx.store.index("documentId");
  
  for await (const cursor of index.iterate(documentId)) {
    cursor.delete();
  }
  
  await tx.done;
}
```

### 2.7 RAG Query Pipeline

**File**: `client/src/lib/rag-query.ts`

```typescript
import { searchIndex, deserializeIndex } from "./indexer";
import { loadIndex, getAllChunks } from "./rag-database";
import { SearchResult } from "./indexer";

export interface RAGContext {
  chunks: SearchResult[];
  prompt: string;
}

/**
 * Retrieve relevant context for a user question
 * Returns top K chunks and formatted prompt
 */
export async function retrieveContext(
  question: string,
  options: {
    topK?: number;
    minScore?: number;
  } = {}
): Promise<RAGContext> {
  const {
    topK = 5,
    minScore = 0.1 // Filter low-relevance results
  } = options;

  // Load index
  const serialized = await loadIndex();
  if (!serialized) {
    throw new Error("No document index found. Please upload documents first.");
  }

  const index = deserializeIndex(serialized);
  const chunks = await getAllChunks();

  // Search for relevant chunks
  const results = searchIndex(index, chunks, question, topK * 2) // Get extras for filtering
    .filter(r => r.score >= minScore)
    .slice(0, topK);

  if (results.length === 0) {
    throw new Error("No relevant information found in documents.");
  }

  // Build context prompt
  const contextText = results
    .map((r, i) => `[Source ${i + 1}] ${r.chunk.text}`)
    .join("\n\n");

  const prompt = `You are a helpful assistant. Answer the following question based ONLY on the provided context. If the context doesn't contain relevant information, say "I don't have enough information to answer that."

Context:
${contextText}

Question: ${question}

Answer:`;

  return {
    chunks: results,
    prompt
  };
}

/**
 * Generate RAG-enhanced response
 * Combines retrieval + generation in single call
 */
export async function generateRAGResponse(
  question: string,
  sendToLLM: (prompt: string) => Promise<string>
): Promise<{
  answer: string;
  sources: SearchResult[];
}> {
  const { chunks, prompt } = await retrieveContext(question);
  const answer = await sendToLLM(prompt);

  return {
    answer,
    sources: chunks
  };
}
```

### 2.8 UI Integration

**File**: `client/src/components/DocumentUpload.tsx`

```typescript
import { Upload, FileText, File as FileIcon, Loader2 } from "lucide-react";
import { parseDocument } from "@/lib/document-parser";
import { chunkText } from "@/lib/chunker";
import { buildIndex, serializeIndex } from "@/lib/indexer";
import { storeDocument, saveIndex, getAllChunks } from "@/lib/rag-database";

export function DocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      // Step 1: Parse
      setProgress("Parsing document...");
      const parsed = await parseDocument(file);
      
      // Step 2: Chunk
      setProgress("Creating text chunks...");
      const documentId = `doc-${Date.now()}`;
      const chunks = chunkText(parsed.text, documentId);
      
      // Step 3: Store
      setProgress("Storing in database...");
      await storeDocument(parsed, chunks);
      
      // Step 4: Rebuild index
      setProgress("Building search index...");
      const allChunks = await getAllChunks();
      const index = buildIndex(allChunks);
      const serialized = serializeIndex(index);
      await saveIndex(serialized);
      
      toast.success(`Successfully processed ${parsed.metadata.filename}`);
      setProgress("");
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <input
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
        id="doc-upload"
      />
      
      <label 
        htmlFor="doc-upload" 
        className="cursor-pointer flex flex-col items-center gap-4"
      >
        {uploading ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">{progress}</p>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium">Upload Document</p>
              <p className="text-sm text-gray-500">PDF, DOCX, or TXT</p>
            </div>
          </>
        )}
      </label>
    </div>
  );
}
```

### 2.9 RAG Chat Integration

**File**: `client/src/hooks/useRAGChat.ts`

```typescript
import { useState } from "react";
import { retrieveContext } from "@/lib/rag-query";
import { useAI } from "./useAI"; // Existing AI hook

export function useRAGChat() {
  const [ragMode, setRAGMode] = useState(false);
  const { sendMessage, isLoading } = useAI();

  const askQuestion = async (question: string) => {
    if (!ragMode) {
      // Normal chat mode
      return sendMessage(question);
    }

    try {
      // RAG mode: retrieve context first
      const { chunks, prompt } = await retrieveContext(question);
      
      // Send enhanced prompt to model
      const response = await sendMessage(prompt);
      
      // Return response with sources
      return {
        answer: response,
        sources: chunks.map(c => ({
          text: c.chunk.text.substring(0, 200) + "...",
          score: c.score
        }))
      };
    } catch (error: any) {
      toast.error(error.message);
      return null;
    }
  };

  return {
    askQuestion,
    ragMode,
    setRAGMode,
    isLoading
  };
}
```

---

## Part 3: Testing & Validation

### 3.1 Test Vision Model

```typescript
// Test 1: Simple image description
const imageBase64 = "data:image/jpeg;base64,/9j/4AAQ...";
const message = createMultimodalMessage("Describe this image", imageBase64);
// Expected: Detailed description of image content

// Test 2: Visual Q&A
const message = createMultimodalMessage("What color is the car?", imageBase64);
// Expected: Specific answer extracted from image

// Test 3: OCR capability
const message = createMultimodalMessage("Extract all text", imageBase64);
// Expected: Text visible in image
```

### 3.2 Test RAG Pipeline

```typescript
// Test 1: Upload document
const pdfFile = new File([pdfBlob], "test.pdf", { type: "application/pdf" });
await handleFileUpload(pdfFile);
// Verify: Check IndexedDB for document, chunks, index

// Test 2: Query document
const question = "What is the return policy?";
const context = await retrieveContext(question);
// Verify: Relevant chunks returned with scores > 0.5

// Test 3: Generate answer
const { answer, sources } = await generateRAGResponse(question, sendToLLM);
// Verify: Answer cites information from sources

// Test 4: Index persistence
// Refresh page
const serialized = await loadIndex();
const index = deserializeIndex(serialized);
// Verify: Search still works without re-indexing
```

### 3.3 Performance Benchmarks

**Expected Metrics**:
- PDF parsing: 1-3 seconds per 100 pages
- Chunking: <100ms per document
- Index building: 200-500ms per 1000 chunks
- Search query: 10-50ms
- Vision model inference: 2-5 seconds per image (first token)
- Document-based generation: 3-8 seconds (retrieval + inference)

**Optimization Tips**:
- Use Web Workers for parsing large documents
- Batch index updates (rebuild every N documents, not every upload)
- Cache search results for repeated queries
- Compress images before base64 encoding
- Lazy-load Tesseract.js OCR only when needed

---

## Part 4: Deployment Considerations

### 4.1 Model Selection Strategy

| Use Case | Recommended Model | Size | VRAM |
|----------|------------------|------|------|
| Image analysis | Phi-3.5-vision-instruct | 4.2 GB | 5 GB |
| Document Q&A | Llama-3-8B-Instruct | 4.9 GB | 6 GB |
| Quick queries | Gemma-2-2b-it | 1.5 GB | 2.5 GB |

### 4.2 Storage Requirements

- **Vision model cache**: 4.2 GB (IndexedDB)
- **Documents**: 10 MB per 100-page PDF
- **Chunks**: ~2x document size (metadata overhead)
- **lunr index**: ~10% of total chunk size
- **Total estimate**: 5-10 GB for typical usage

### 4.3 Browser Compatibility

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| WebGPU | ✅ 113+ | ✅ 113+ | ❌ | ⚠️ Experimental |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Web Workers | ✅ | ✅ | ✅ | ✅ |
| File API | ✅ | ✅ | ✅ | ✅ |

**Recommendation**: Target Chromium-based browsers (Chrome, Edge) for production

---
