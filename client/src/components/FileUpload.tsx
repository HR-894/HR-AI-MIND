import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, FileText, Image as ImageIcon, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface UploadedFile {
  id: string;
  file: File;
  type: "image" | "document" | "unknown";
  preview?: string; // base64 for images
  content?: string; // text content for documents
}

interface FileUploadProps {
  onFileSelect: (files: UploadedFile[]) => void;
  onFilesChange: (files: UploadedFile[]) => void;
  selectedFiles: UploadedFile[];
  disabled?: boolean;
  acceptedTypes?: string;
  maxFiles?: number;
  maxSizeMB?: number;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"];
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword", // doc
  "text/plain",
  "text/csv",
];

export function FileUpload({
  onFileSelect,
  onFilesChange,
  selectedFiles,
  disabled = false,
  acceptedTypes = "image/*,.pdf,.docx,.doc,.txt,.csv",
  maxFiles = 5,
  maxSizeMB = 10,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const detectFileType = (file: File): "image" | "document" | "unknown" => {
    if (IMAGE_TYPES.includes(file.type) || file.type.startsWith("image/")) {
      return "image";
    }
    if (DOCUMENT_TYPES.includes(file.type) || file.name.match(/\.(pdf|docx?|txt|csv)$/i)) {
      return "document";
    }
    return "unknown";
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check max files limit
    if (selectedFiles.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    const processedFiles: UploadedFile[] = [];

    for (const file of files) {
      // Check file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        toast({
          title: `File too large: ${file.name}`,
          description: `Maximum size is ${maxSizeMB}MB. File is ${sizeMB.toFixed(1)}MB`,
          variant: "destructive",
        });
        continue;
      }

      const fileType = detectFileType(file);

      if (fileType === "unknown") {
        toast({
          title: `Unsupported file type: ${file.name}`,
          description: "Please upload images or documents (PDF, DOCX, TXT)",
          variant: "destructive",
        });
        continue;
      }

      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        type: fileType,
      };

      // Process based on type
      if (fileType === "image") {
        try {
          const base64 = await readFileAsBase64(file);
          uploadedFile.preview = base64;
        } catch (error) {
          console.error("Error reading image:", error);
          toast({
            title: "Error reading image",
            description: `Failed to process ${file.name}`,
            variant: "destructive",
          });
          continue;
        }
      } else if (fileType === "document") {
        // For documents, we'll process them later when sending
        // Just store the file reference for now
        uploadedFile.content = `Document: ${file.name} (${sizeMB.toFixed(2)}MB)`;
      }

      processedFiles.push(uploadedFile);
    }

    if (processedFiles.length > 0) {
      const newFiles = [...selectedFiles, ...processedFiles];
      onFilesChange(newFiles);
      onFileSelect(processedFiles);
      
      toast({
        title: `${processedFiles.length} file(s) added`,
        description: "Ready to send with your message",
      });
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    const newFiles = selectedFiles.filter(f => f.id !== id);
    onFilesChange(newFiles);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-2">
      {/* File previews */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file) => (
            <div
              key={file.id}
              className="relative group flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg"
            >
              {file.type === "image" && file.preview ? (
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="h-10 w-10 object-cover rounded"
                />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-800 rounded">
                  {getFileIcon(file.type)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate max-w-[150px]">
                  {file.file.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {(file.file.size / 1024).toFixed(1)} KB
                </p>
              </div>

              <button
                onClick={() => removeFile(file.id)}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={disabled}
                aria-label={`Remove ${file.file.name}`}
                title={`Remove ${file.file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
        aria-label="Upload files"
      />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || selectedFiles.length >= maxFiles}
        className="w-full sm:w-auto"
      >
        <Paperclip className="h-4 w-4 mr-2" />
        Attach File
        {selectedFiles.length > 0 && ` (${selectedFiles.length}/${maxFiles})`}
      </Button>
    </div>
  );
}
