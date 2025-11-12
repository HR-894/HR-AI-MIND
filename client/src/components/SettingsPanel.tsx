import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import type { Settings } from "@shared/schema";
import { DEFAULT_SETTINGS } from "@shared/schema";
import { ModelPerformancePanel } from "./ModelPerformancePanel";
import { StorageManagementPanel } from "./StorageManagementPanel";
import { CacheDebugger } from "./CacheDebugger";
import { isModelCached, getAvailableModels } from "@/lib/model-utils";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function SettingsPanel({ open, onClose, settings, onSave }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);
  const [showDownloadAlert, setShowDownloadAlert] = useState(false);
  const [selectedUnavailableModel, setSelectedUnavailableModel] = useState<string>("");

  // Check which models are downloaded
  useEffect(() => {
    const checkModels = async () => {
      const models = getAvailableModels();
      const downloaded: string[] = [];
      
      for (const model of models) {
        const isCached = await isModelCached(model.id);
        if (isCached) {
          downloaded.push(model.id);
        }
      }
      
      console.log("Downloaded models:", downloaded);
      setDownloadedModels(downloaded);
    };
    
    if (open) {
      checkModels();
    }
  }, [open]);

  const handleModelChange = async (value: string) => {
    // Check if model is downloaded
    const isCached = await isModelCached(value);
    
    if (!isCached) {
      // Model not downloaded, show alert
      const model = getAvailableModels().find(m => m.id === value);
      setSelectedUnavailableModel(model?.displayName || value);
      setShowDownloadAlert(true);
    } else {
      // Model is downloaded, allow selection
      setLocalSettings(prev => ({ ...prev, modelId: value }));
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">Settings</SheetTitle>
          <SheetDescription>
            Configure your AI assistant preferences
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="persona">Persona</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label htmlFor="model">AI Model</Label>
            <Select
              value={localSettings.modelId}
              onValueChange={handleModelChange}
            >
              <SelectTrigger id="model" data-testid="select-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Llama-3.2-1B-Instruct-q4f32_1-MLC">
                  Llama 3.2 1B (Fast) {downloadedModels.includes("Llama-3.2-1B-Instruct-q4f32_1-MLC") ? "✓" : ""}
                </SelectItem>
                <SelectItem value="Llama-3.2-3B-Instruct-q4f32_1-MLC">
                  Llama 3.2 3B (Balanced) {downloadedModels.includes("Llama-3.2-3B-Instruct-q4f32_1-MLC") ? "✓" : ""}
                </SelectItem>
                <SelectItem value="Phi-3.5-mini-instruct-q4f16_1-MLC">
                  Phi 3.5 Mini (Technical) {downloadedModels.includes("Phi-3.5-mini-instruct-q4f16_1-MLC") ? "✓" : ""}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Switch models during chat. Use the header dropdown to download new models.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-sm text-muted-foreground">{localSettings.temperature.toFixed(2)}</span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[localSettings.temperature]}
              onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, temperature: value ?? 0.7 }))}
              data-testid="slider-temperature"
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness. Lower is more focused, higher is more creative.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              min={1}
              max={4096}
              value={localSettings.maxTokens}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                maxTokens: parseInt(e.target.value) || 1 
              }))}
              data-testid="input-max-tokens"
            />
            <p className="text-xs text-muted-foreground">
              Maximum length of generated responses.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="contextWindow">Context Window (messages)</Label>
            <Input
              id="contextWindow"
              type="number"
              min={1}
              max={50}
              value={localSettings.contextWindow}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                contextWindow: parseInt(e.target.value) || 1 
              }))}
              data-testid="input-context-window"
            />
            <p className="text-xs text-muted-foreground">
              Number of recent messages to include as context.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={localSettings.theme}
              onValueChange={(value: Settings["theme"]) => 
                setLocalSettings(prev => ({ ...prev, theme: value }))
              }
            >
              <SelectTrigger id="theme" data-testid="select-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="stt">Speech to Text</Label>
              <p className="text-xs text-muted-foreground">
                Enable voice input
              </p>
            </div>
            <Switch
              id="stt"
              checked={localSettings.enableSTT}
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, enableSTT: checked }))}
              data-testid="switch-stt"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="tts">Text to Speech</Label>
              <p className="text-xs text-muted-foreground">
                Enable voice output
              </p>
            </div>
            <Switch
              id="tts"
              checked={localSettings.enableTTS}
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, enableTTS: checked }))}
              data-testid="switch-tts"
            />
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
              data-testid="button-reset-settings"
            >
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              data-testid="button-save-settings"
            >
              Save Changes
            </Button>
          </div>
          </TabsContent>

          <TabsContent value="persona" className="space-y-6 mt-4">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🎭 AI Persona
            </h3>

            {/* Quick Presets */}
            <div className="mb-4 space-y-2">
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalSettings(prev => ({
                    ...prev,
                    systemPrompt: "You are a helpful, friendly AI assistant.",
                    responseLength: "balanced",
                    responseTone: "friendly",
                    customInstructions: "",
                  }))}
                  className="text-xs"
                >
                  😊 Friendly Helper
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalSettings(prev => ({
                    ...prev,
                    systemPrompt: "You are a professional business consultant and expert advisor.",
                    responseLength: "detailed",
                    responseTone: "professional",
                    customInstructions: "Focus on actionable insights and strategic thinking.",
                  }))}
                  className="text-xs"
                >
                  💼 Professional
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalSettings(prev => ({
                    ...prev,
                    systemPrompt: "You are a technical expert and software engineer.",
                    responseLength: "detailed",
                    responseTone: "technical",
                    customInstructions: "Provide code examples and technical details. Use precise terminology.",
                  }))}
                  className="text-xs"
                >
                  🔧 Tech Expert
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalSettings(prev => ({
                    ...prev,
                    systemPrompt: "You are a creative brainstorming partner.",
                    responseLength: "balanced",
                    responseTone: "enthusiastic",
                    customInstructions: "Think outside the box. Suggest creative alternatives.",
                  }))}
                  className="text-xs"
                >
                  🎨 Creative Mind
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalSettings(prev => ({
                    ...prev,
                    systemPrompt: "You are a patient teacher and educator.",
                    responseLength: "detailed",
                    responseTone: "friendly",
                    customInstructions: "Explain concepts clearly with examples. Break down complex topics step by step.",
                  }))}
                  className="text-xs"
                >
                  📚 Teacher
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalSettings(prev => ({
                    ...prev,
                    systemPrompt: "You are a quick-response assistant.",
                    responseLength: "concise",
                    responseTone: "casual",
                    customInstructions: "Get straight to the point. No fluff.",
                  }))}
                  className="text-xs"
                >
                  ⚡ Quick Answer
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="responseLength">Response Length</Label>
                <Select
                  value={localSettings.responseLength}
                  onValueChange={(value: Settings["responseLength"]) => 
                    setLocalSettings(prev => ({ ...prev, responseLength: value }))
                  }
                >
                  <SelectTrigger id="responseLength">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">🎯 Concise - Short & direct</SelectItem>
                    <SelectItem value="balanced">⚖️ Balanced - Moderate detail</SelectItem>
                    <SelectItem value="detailed">📚 Detailed - Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="responseTone">Response Tone</Label>
                <Select
                  value={localSettings.responseTone}
                  onValueChange={(value: Settings["responseTone"]) => 
                    setLocalSettings(prev => ({ ...prev, responseTone: value }))
                  }
                >
                  <SelectTrigger id="responseTone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">💼 Professional</SelectItem>
                    <SelectItem value="friendly">😊 Friendly</SelectItem>
                    <SelectItem value="casual">😎 Casual</SelectItem>
                    <SelectItem value="enthusiastic">🎉 Enthusiastic</SelectItem>
                    <SelectItem value="technical">🔧 Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Input
                  id="systemPrompt"
                  value={localSettings.systemPrompt}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    systemPrompt: e.target.value 
                  }))}
                  placeholder="You are a helpful assistant..."
                />
                <p className="text-xs text-muted-foreground">
                  Define the AI's role and behavior
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="customInstructions">Custom Instructions</Label>
                <Textarea
                  id="customInstructions"
                  value={localSettings.customInstructions}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    customInstructions: e.target.value 
                  }))}
                  placeholder="Additional instructions for how the AI should respond..."
                  className="min-h-[100px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Add specific guidelines, formatting preferences, or context
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
                data-testid="button-reset-settings"
              >
                Reset to Defaults
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                data-testid="button-save-settings"
              >
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-4">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">⚙️ Generation Controls</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between"><Label>Top P</Label><span className="text-xs text-muted-foreground">{localSettings.topP.toFixed(2)}</span></div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[localSettings.topP]}
                    onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, topP: value ?? 0.95 }))}
                  />
                  <p className="text-xs text-muted-foreground">Nucleus sampling threshold. Lower = more conservative.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><Label>Frequency Penalty</Label><span className="text-xs text-muted-foreground">{localSettings.frequencyPenalty.toFixed(2)}</span></div>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={[localSettings.frequencyPenalty]}
                    onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, frequencyPenalty: value ?? 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Penalizes repeated tokens proportionally to frequency.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><Label>Presence Penalty</Label><span className="text-xs text-muted-foreground">{localSettings.presencePenalty.toFixed(2)}</span></div>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={[localSettings.presencePenalty]}
                    onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, presencePenalty: value ?? 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Encourages introducing new topics; higher = more diverse.</p>
                </div>
              </div>
              <ModelPerformancePanel />
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={handleReset} className="flex-1">Reset</Button>
                <Button onClick={handleSave} className="flex-1">Save</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="storage" className="mt-4 space-y-4">
            <CacheDebugger />
            <StorageManagementPanel />
          </TabsContent>
        </Tabs>
      </SheetContent>

      {/* Model Download Alert */}
      <AlertDialog open={showDownloadAlert} onOpenChange={setShowDownloadAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Model Not Downloaded</AlertDialogTitle>
            <AlertDialogDescription>
              The model "{selectedUnavailableModel}" is not downloaded yet. 
              Please download it first from the model download manager in the chat header.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDownloadAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
