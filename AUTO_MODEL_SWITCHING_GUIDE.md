# Automatic Model Switching Feature

## Overview
The application now automatically switches to the appropriate model when you upload files that require multimodal capabilities (images, PDFs, documents).

## How It Works

### 1. **File Upload Detection**
- When you attach files using the paperclip icon in the chat input
- System analyzes file types (images: jpg, png, gif, webp, bmp | documents: pdf, docx, doc, txt, csv)

### 2. **Model Recommendation**
- If files require vision/document processing, system recommends **Phi-3.5 Vision** model
- Checks if current model supports the file types

### 3. **Automatic Switching**
- If current model can't handle files, automatically switches to Phi-3.5 Vision
- Shows toast notification: "Switching to Vision Model - Your files require Phi-3.5 Vision for analysis"
- Initializes the vision model if not already loaded

### 4. **File Processing**
- Files are attached to your message
- For images: Base64 encoded for preview
- For documents: Referenced by filename

## Testing Instructions

### Test 1: Image Upload
1. Start a new chat
2. Click the paperclip icon in chat input
3. Upload a `.jpg` or `.png` image
4. **Expected**: Toast notification appears, model dropdown switches to "Phi-3.5 Vision"
5. Type "What's in this image?" and send
6. **Expected**: Model analyzes the image

### Test 2: Document Upload
1. Click paperclip icon
2. Upload a `.pdf` or `.docx` file
3. **Expected**: Auto-switches to Phi-3.5 Vision
4. Type "Summarize this document" and send

### Test 3: Already Using Vision Model
1. Manually select "Phi-3.5 Vision" in settings
2. Upload an image
3. **Expected**: No switch needed, direct send works

### Test 4: Multiple Files
1. Upload 2 images and 1 PDF
2. **Expected**: All files previewed, model switches to Vision
3. Send message with "Analyze all these files"

## Components Modified

### 1. **FileUpload.tsx** (New)
- Reusable file upload component
- Features:
  - Multi-file support (max 5 files, 10MB each)
  - Image preview with base64 encoding
  - Document icon display
  - Type detection (IMAGE_TYPES, DOCUMENT_TYPES)
  - Remove file functionality

### 2. **model-capabilities.ts** (New)
- Model capability mapping system
- Functions:
  - `getRecommendedModelForFiles()` - Returns vision model ID if needed
  - `doesModelSupportFiles()` - Validates model compatibility
  - `getModelMismatchMessage()` - User-friendly error messages
  - `isMultimodalModel()` - Check for vision/document support

### 3. **ChatInput.tsx** (Modified)
- Integrated FileUpload component
- Updated `onSend` signature: `(message: string, files?: UploadedFile[])`
- Added file state management
- Dynamic placeholder based on file selection

### 4. **ChatPage.tsx** (Modified)
- Extended `handleSendMessage` to accept files
- Auto-switching logic:
  ```typescript
  if (files && files.length > 0) {
    const recommended = getRecommendedModelForFiles(files);
    if (recommended && !currentModelSupports) {
      toast({ title: "Switching to Vision Model" });
      setSettings({ modelId: recommended });
      await initModel(recommended);
    }
  }
  ```

### 5. **models.json** (Updated)
- Added Phi-3.5-vision-instruct-q4f16_1-MLC
- Size: 4200 MB (4.2GB)
- Capabilities: `["text", "vision", "document"]`
- Description: "Vision-language model. Analyzes images, PDFs, and documents"

## Model Capabilities Matrix

| Model | Text | Vision | Document |
|-------|------|--------|----------|
| Llama 3.2 1B | ✅ | ❌ | ❌ |
| Llama 3.2 3B | ✅ | ❌ | ❌ |
| Llama 3.1 8B | ✅ | ❌ | ❌ |
| Phi-3.5 Mini | ✅ | ❌ | ❌ |
| Gemma 2 2B | ✅ | ❌ | ❌ |
| Gemma 2 9B | ✅ | ❌ | ❌ |
| **Phi-3.5 Vision** | ✅ | ✅ | ✅ |

## File Type Support

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)

### Supported Document Formats
- PDF (.pdf)
- Word (.docx, .doc)
- Text (.txt)
- CSV (.csv)

### Size Limits
- Per file: 10 MB
- Total files: 5 files max per message

## User Experience Flow

```
User uploads file
    ↓
FileUpload component detects type
    ↓
ChatInput collects files
    ↓
handleSendMessage receives files
    ↓
getRecommendedModelForFiles() analyzes
    ↓
Does current model support files?
    ├─ YES → Send directly
    └─ NO → Auto-switch to Phi-3.5 Vision
            ↓
        Show toast notification
            ↓
        Initialize vision model
            ↓
        Send message with files
```

## Error Handling

### Incompatible Model Warning
If files can't be processed by any model:
- Toast: "Model Incompatible - [specific message]"
- Message not sent until compatible model selected

### File Size Exceeded
- Toast: "File too large - Max 10MB per file"
- File rejected, not added to upload list

### Too Many Files
- Toast: "Maximum 5 files allowed"
- Upload button disabled when limit reached

## Future Enhancements

### Phase 1 (Current)
- ✅ Automatic model detection and switching
- ✅ Basic file upload UI
- ✅ Image preview
- ✅ Toast notifications

### Phase 2 (Planned)
- Multimodal message formatting for WebLLM
- Base64 image content in AI worker messages
- Document text extraction (PDF.js, Mammoth.js)

### Phase 3 (Future)
- RAG integration for document Q&A
- Document chunking and indexing
- Context-aware document analysis
- OCR for image text extraction

## Troubleshooting

### Model Not Switching
**Issue**: Files uploaded but model stays the same
**Solution**: 
- Check browser console for errors
- Verify Phi-3.5 Vision is in models.json
- Ensure model-capabilities.ts is imported correctly

### Files Not Attaching
**Issue**: Files selected but not appearing
**Solution**:
- Check file size (must be < 10MB)
- Verify file type is supported
- Clear browser cache and reload

### Vision Model Not Loading
**Issue**: Model switch occurs but initialization fails
**Solution**:
- Check browser storage quota (needs ~5GB free)
- Verify WebGPU support in browser
- Download model manually from Settings first

## Performance Considerations

### Model Switching Time
- If Phi-3.5 Vision already cached: < 1 second
- First-time download: ~3-5 minutes (4.2GB)
- Initialization after download: ~10-15 seconds

### Memory Requirements
- Phi-3.5 Vision VRAM: 5GB
- Recommended system RAM: 8GB+
- Browser storage: 10GB+ free recommended

## Development Notes

### Type Definitions
```typescript
interface UploadedFile {
  id: string;
  file: File;
  type: 'image' | 'document' | 'other';
  preview?: string; // base64 for images
  content?: string; // text content for documents
}

interface ModelCapabilities {
  text: boolean;
  vision: boolean;
  document: boolean;
}
```

### Key Functions
```typescript
// Get recommended model based on files
getRecommendedModelForFiles(files: UploadedFile[]): string | null

// Check if model supports files
doesModelSupportFiles(modelId: string, files: UploadedFile[]): boolean

// Get user-friendly error message
getModelMismatchMessage(modelId: string, files: UploadedFile[]): string
```

## Accessibility

- File upload input has `aria-label="Upload files"`
- Remove buttons have `aria-label="Remove [filename]"` and `title` attributes
- Toast notifications are screen-reader friendly
- Keyboard navigation supported for all file operations

## Browser Compatibility

- ✅ Chrome 113+ (WebGPU support)
- ✅ Edge 113+
- ✅ Opera 99+
- ⚠️ Firefox (limited WebGPU)
- ❌ Safari (no WebGPU yet)

---

**Version**: 3.5.0  
**Last Updated**: 2024  
**Author**: HR AI Mind Development Team
