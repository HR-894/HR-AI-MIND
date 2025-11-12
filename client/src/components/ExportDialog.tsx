import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { FileText, FileCode, FileJson, Globe, Download } from "lucide-react";

export interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: "txt" | "md" | "json" | "html", options: {
    includeTimestamps: boolean;
    includeMetadata: boolean;
  }) => void;
  chatTitle: string;
}

export function ExportDialog({ open, onClose, onExport, chatTitle }: ExportDialogProps) {
  const [format, setFormat] = useState<"txt" | "md" | "json" | "html">("md");
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const handleExport = () => {
    onExport(format, { includeTimestamps, includeMetadata });
    onClose();
  };

  const formats = [
    {
      value: "txt",
      label: "Plain Text",
      icon: FileText,
      description: "Simple text format, easy to read",
      extension: ".txt"
    },
    {
      value: "md",
      label: "Markdown",
      icon: FileCode,
      description: "Formatted text with styling",
      extension: ".md"
    },
    {
      value: "json",
      label: "JSON",
      icon: FileJson,
      description: "Structured data format",
      extension: ".json"
    },
    {
      value: "html",
      label: "HTML",
      icon: Globe,
      description: "Styled web page",
      extension: ".html"
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Export Chat
          </DialogTitle>
          <DialogDescription>
            Download "{chatTitle}" in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as any)}>
              <div className="grid grid-cols-2 gap-3">
                {formats.map((fmt) => {
                  const Icon = fmt.icon;
                  return (
                    <label
                      key={fmt.value}
                      className={`
                        relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${format === fmt.value 
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950" 
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                        }
                      `}
                    >
                      <RadioGroupItem value={fmt.value} className="sr-only" />
                      <Icon className={`h-6 w-6 ${format === fmt.value ? "text-blue-600" : "text-gray-600"}`} />
                      <div className="text-center">
                        <div className="font-semibold text-sm">{fmt.label}</div>
                        <div className="text-xs text-muted-foreground">{fmt.extension}</div>
                      </div>
                      {format === fmt.value && (
                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-2">
              {formats.find(f => f.value === format)?.description}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4 pt-4 border-t">
            <Label>Export Options</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="timestamps" className="font-normal">Include Timestamps</Label>
                <p className="text-xs text-muted-foreground">
                  Show when each message was sent
                </p>
              </div>
              <Switch
                id="timestamps"
                checked={includeTimestamps}
                onCheckedChange={setIncludeTimestamps}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="metadata" className="font-normal">Include Metadata</Label>
                <p className="text-xs text-muted-foreground">
                  Add chat details and statistics
                </p>
              </div>
              <Switch
                id="metadata"
                checked={includeMetadata}
                onCheckedChange={setIncludeMetadata}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Download {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
