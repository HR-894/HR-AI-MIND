import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, Save, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ModelMeta } from "@/lib/models";
import { sanitizePlainText } from "@/lib/markdown";

const ADMIN_KEY = "hrai-admin-mode";
const CUSTOM_MODELS_KEY = "hrai-custom-models";
const SECRET_CODE = import.meta.env.VITE_ADMIN_ACCESS_CODE || "HRAI2025";

// Rate limiting for admin authentication
const MAX_AUTH_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const AUTH_ATTEMPTS_KEY = "hrai-admin-attempts";
const AUTH_LOCKOUT_KEY = "hrai-admin-lockout";

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState(() => {
    return localStorage.getItem(ADMIN_KEY) === "true";
  });
  const [secretCode, setSecretCode] = useState("");
  const [customModels, setCustomModels] = useState<ModelMeta[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_MODELS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newModel, setNewModel] = useState<Partial<ModelMeta>>({
    id: "",
    name: "",
    displayName: "",
    sizeMB: 0,
    quantization: "q4f32_1",
    vramMinGB: 2,
    speed: "Balanced",
    description: "",
    recommended: "",
  });

  const { toast } = useToast();

  const handleAuthenticate = () => {
    // Check if locked out
    const lockoutUntil = localStorage.getItem(AUTH_LOCKOUT_KEY);
    if (lockoutUntil) {
      const lockoutTime = parseInt(lockoutUntil);
      if (Date.now() < lockoutTime) {
        const remainingMinutes = Math.ceil((lockoutTime - Date.now()) / 60000);
        toast({
          title: "Too many attempts",
          description: `Account locked. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`,
          variant: "destructive",
        });
        return;
      } else {
        // Lockout expired, clear it
        localStorage.removeItem(AUTH_LOCKOUT_KEY);
        localStorage.removeItem(AUTH_ATTEMPTS_KEY);
      }
    }

    if (secretCode === SECRET_CODE) {
      // Success - clear attempts and grant access
      localStorage.removeItem(AUTH_ATTEMPTS_KEY);
      localStorage.removeItem(AUTH_LOCKOUT_KEY);
      localStorage.setItem(ADMIN_KEY, "true");
      setAuthenticated(true);
      toast({
        title: "Admin access granted",
        description: "You can now manage custom models",
      });
    } else {
      // Failed attempt - increment counter
      const attempts = parseInt(localStorage.getItem(AUTH_ATTEMPTS_KEY) || "0") + 1;
      localStorage.setItem(AUTH_ATTEMPTS_KEY, attempts.toString());

      if (attempts >= MAX_AUTH_ATTEMPTS) {
        // Lock out the user
        localStorage.setItem(AUTH_LOCKOUT_KEY, (Date.now() + LOCKOUT_DURATION).toString());
        toast({
          title: "Account locked",
          description: "Too many failed attempts. Try again in 15 minutes.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invalid code",
          description: `${MAX_AUTH_ATTEMPTS - attempts} attempt${MAX_AUTH_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining`,
          variant: "destructive",
        });
      }
    }
  };

  const handleAddModel = () => {
    // Validation
    if (!newModel.id || !newModel.name || !newModel.displayName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (ID, Name, Display Name)",
        variant: "destructive",
      });
      return;
    }

    // Strict ID validation: only alphanumerics, dash, underscore, dot and must end with -MLC
    const id = (newModel.id || "").trim();
    if (!/^[A-Za-z0-9._-]+-MLC$/.test(id)) {
      toast({
        title: "Invalid Model ID",
        description: "Model ID must use only letters, numbers, '-', '_', '.' and end with '-MLC' (e.g., 'Llama-3-8B-q4f32_1-MLC')",
        variant: "destructive",
      });
      return;
    }

    // Sanitize all user-provided fields before saving to localStorage
    const sanitizedModel: ModelMeta = {
      id,
      name: sanitizePlainText(newModel.name || ""),
      displayName: sanitizePlainText(newModel.displayName || ""),
      sizeMB: Math.max(0, Number(newModel.sizeMB) || 0),
      quantization: sanitizePlainText(newModel.quantization || "q4f32_1"),
      vramMinGB: Math.max(0, Number(newModel.vramMinGB) || 0),
      speed: sanitizePlainText(newModel.speed || "Balanced"),
      description: sanitizePlainText(newModel.description || ""),
      recommended: sanitizePlainText(newModel.recommended || ""),
    };

    const updatedModels = [...customModels, sanitizedModel];
    setCustomModels(updatedModels);
    localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(updatedModels));

    toast({
      title: "Model Added",
      description: `${sanitizedModel.displayName} has been added to your custom models`,
    });

    // Reset form
    setNewModel({
      id: "",
      name: "",
      displayName: "",
      sizeMB: 0,
      quantization: "q4f32_1",
      vramMinGB: 2,
      speed: "Balanced",
      description: "",
      recommended: "",
    });
  };

  const handleDeleteModel = (id: string) => {
    const updatedModels = customModels.filter(m => m.id !== id);
    setCustomModels(updatedModels);
    localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(updatedModels));

    toast({
      title: "Model Removed",
      description: "Custom model has been deleted",
    });
  };

  const handleExportModels = () => {
    const dataStr = JSON.stringify(customModels, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "custom-models.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Models Exported",
      description: "Custom models have been exported to JSON",
    });
  };

  if (!authenticated) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-orange-500" />
              Admin Access Required
            </DialogTitle>
            <DialogDescription>
              This is a restricted area for testing new models before public release.
              Enter the secret code to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="secret-code">Secret Code</Label>
              <Input
                id="secret-code"
                type="password"
                placeholder="Enter secret code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuthenticate()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAuthenticate}>
              Authenticate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admin Panel - Custom Models</DialogTitle>
          <DialogDescription>
            Add and manage custom AI models for testing before public release.
            Models added here will only be visible on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add New Model Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Model
              </CardTitle>
              <CardDescription>
                Configure a new WebLLM model. Model must be compatible with @mlc-ai/web-llm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model-id">Model ID *</Label>
                  <Input
                    id="model-id"
                    placeholder="Llama-3-8B-q4f32_1-MLC"
                    value={newModel.id}
                    onChange={(e) => setNewModel({ ...newModel, id: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must match WebLLM model registry ID (ends with -MLC)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model-name">Name *</Label>
                  <Input
                    id="model-name"
                    placeholder="Llama 3 8B"
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name *</Label>
                  <Input
                    id="display-name"
                    placeholder="Llama 3 8B Instruct"
                    value={newModel.displayName}
                    onChange={(e) => setNewModel({ ...newModel, displayName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size (MB) *</Label>
                  <Input
                    id="size"
                    type="number"
                    placeholder="4500"
                    value={newModel.sizeMB}
                    onChange={(e) => setNewModel({ ...newModel, sizeMB: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantization">Quantization</Label>
                  <Input
                    id="quantization"
                    placeholder="q4f32_1"
                    value={newModel.quantization}
                    onChange={(e) => setNewModel({ ...newModel, quantization: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vram">VRAM Min (GB)</Label>
                  <Input
                    id="vram"
                    type="number"
                    placeholder="4"
                    value={newModel.vramMinGB}
                    onChange={(e) => setNewModel({ ...newModel, vramMinGB: parseFloat(e.target.value) || 2 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speed">Speed</Label>
                  <Input
                    id="speed"
                    placeholder="Fast / Balanced / Slow"
                    value={newModel.speed}
                    onChange={(e) => setNewModel({ ...newModel, speed: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the model's capabilities..."
                  value={newModel.description}
                  onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommended">Recommended Use Cases</Label>
                <Input
                  id="recommended"
                  placeholder="Coding • General tasks • Research"
                  value={newModel.recommended}
                  onChange={(e) => setNewModel({ ...newModel, recommended: e.target.value })}
                />
              </div>

              <Button onClick={handleAddModel} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
            </CardContent>
          </Card>

          {/* Custom Models List */}
          {customModels.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Custom Models ({customModels.length})</CardTitle>
                    <CardDescription>
                      Models you've added for testing
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportModels}>
                    <Save className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {customModels.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{model.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {model.id} • {(model.sizeMB / 1024).toFixed(2)} GB • {model.vramMinGB} GB VRAM
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteModel(model.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Custom models must be available in the WebLLM model registry</li>
                <li>Model IDs must exactly match the registry (case-sensitive)</li>
                <li>Models are stored locally and won't sync across devices</li>
                <li>Test thoroughly before adding to public models.json</li>
                <li>Export models as JSON to share with other team members</li>
                <li>Custom models appear in the model dropdown alongside default models</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
