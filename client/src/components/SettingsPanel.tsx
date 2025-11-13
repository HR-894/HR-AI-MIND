import { useState, useEffect, lazy, Suspense } from "react";
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
import { X, Shield } from "lucide-react";
import type { Settings } from "@shared/schema";
import { DEFAULT_SETTINGS } from "@shared/schema";
import { ModelPerformancePanel } from "./ModelPerformancePanel";
import { StorageManagementPanel } from "./StorageManagementPanel";
import { AdminPanel } from "./AdminPanel";
import { isModelCached, getAvailableModels } from "@/lib/model-utils";

// Only load CacheDebugger in development mode
const CacheDebugger = lazy(() => import("./CacheDebugger").then(m => ({ default: m.CacheDebugger })));

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
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminKeyCount, setAdminKeyCount] = useState(0);

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
      setAdminKeyCount(0); // Reset counter when opening
    }
  }, [open]);

  // Secret admin access: Press "A" key 5 times rapidly on the settings title
  useEffect(() => {
    if (!open) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'a') {
        setAdminKeyCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 5) {
            setShowAdminPanel(true);
            return 0;
          }
          // Reset counter after 2 seconds of inactivity
          setTimeout(() => setAdminKeyCount(0), 2000);
          return newCount;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
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
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/40 dark:from-slate-800 dark:via-indigo-900/50 dark:to-purple-900/40 border-l-2 border-indigo-200/50 dark:border-indigo-600/60" data-testid="settings-panel">
        <SheetHeader className="pb-4 border-b border-indigo-100 dark:border-indigo-700/60">
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
            Settings
          </SheetTitle>
          <SheetDescription className="text-indigo-600/70 dark:text-indigo-300/80">
            Configure your AI assistant preferences
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-slate-700/90 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-600/60 p-1">
            <TabsTrigger 
              value="general" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white hover:bg-indigo-50 dark:hover:bg-indigo-800/50 transition-all duration-200 dark:text-gray-300"
            >
              General
            </TabsTrigger>
            <TabsTrigger 
              value="persona"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white hover:bg-purple-50 dark:hover:bg-purple-800/50 transition-all duration-200 dark:text-gray-300"
            >
              Persona
            </TabsTrigger>
            <TabsTrigger 
              value="performance"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white hover:bg-blue-50 dark:hover:bg-blue-800/50 transition-all duration-200 dark:text-gray-300"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="storage"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white hover:bg-pink-50 dark:hover:bg-pink-800/50 transition-all duration-200 dark:text-gray-300"
            >
              Storage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-5 mt-4">
          {/* AI Model Section */}
          <div className="space-y-3 p-4 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-200 dark:hover:border-indigo-800/70 hover:shadow-md transition-all duration-300">
            <Label htmlFor="model" className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">AI Model</Label>
            <Select
              value={localSettings.modelId}
              onValueChange={handleModelChange}
            >
              <SelectTrigger id="model" data-testid="select-model" className="border-indigo-200/50 dark:border-indigo-800/50 focus:ring-indigo-300 dark:focus:ring-indigo-700">
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
            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">
              Switch models during chat. Use the header dropdown to download new models.
            </p>
          </div>

          {/* Temperature Section */}
          <div className="space-y-3 p-4 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-purple-100 dark:border-purple-900/50 hover:border-purple-200 dark:hover:border-purple-800/70 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between">
              <Label htmlFor="temperature" className="text-sm font-semibold text-purple-700 dark:text-purple-300">Temperature</Label>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{localSettings.temperature.toFixed(2)}</span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[localSettings.temperature]}
              onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, temperature: value ?? 0.7 }))}
              data-testid="slider-temperature"
              className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-pink-500"
            />
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
              Controls randomness. Lower is more focused, higher is more creative.
            </p>
          </div>

          {/* Max Tokens Section */}
          <div className="space-y-3 p-4 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-blue-100 dark:border-blue-900/50 hover:border-blue-200 dark:hover:border-blue-800/70 hover:shadow-md transition-all duration-300">
            <Label htmlFor="maxTokens" className="text-sm font-semibold text-blue-700 dark:text-blue-300">Max Tokens</Label>
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
              className="border-blue-200/50 dark:border-blue-800/50 focus:ring-blue-300 dark:focus:ring-blue-700"
            />
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
              Maximum length of generated responses.
            </p>
          </div>

          {/* Context Window Section */}
          <div className="space-y-3 p-4 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-pink-100 dark:border-pink-900/50 hover:border-pink-200 dark:hover:border-pink-800/70 hover:shadow-md transition-all duration-300">
            <Label htmlFor="contextWindow" className="text-sm font-semibold text-pink-700 dark:text-pink-300">Context Window (messages)</Label>
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
              className="border-pink-200/50 dark:border-pink-800/50 focus:ring-pink-300 dark:focus:ring-pink-700"
            />
            <p className="text-xs text-pink-600/70 dark:text-pink-400/70">
              Number of recent messages to include as context.
            </p>
          </div>

          {/* Theme Section */}
          <div className="space-y-3 p-4 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-200 dark:hover:border-indigo-800/70 hover:shadow-md transition-all duration-300">
            <Label htmlFor="theme" className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Theme</Label>
            <Select
              value={localSettings.theme}
              onValueChange={(value: Settings["theme"]) => 
                setLocalSettings(prev => ({ ...prev, theme: value }))
              }
            >
              <SelectTrigger id="theme" data-testid="select-theme" className="border-indigo-200/50 dark:border-indigo-800/50 focus:ring-indigo-300 dark:focus:ring-indigo-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Speech to Text Section */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-200 dark:hover:border-emerald-800/70 hover:shadow-md transition-all duration-300">
            <div className="space-y-1">
              <Label htmlFor="stt" className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Speech to Text</Label>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                Enable voice input
              </p>
            </div>
            <Switch
              id="stt"
              checked={localSettings.enableSTT}
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, enableSTT: checked }))}
              data-testid="switch-stt"
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-teal-500"
            />
          </div>

          {/* Text to Speech Section */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-blue-100 dark:border-blue-900/50 hover:border-blue-200 dark:hover:border-blue-800/70 hover:shadow-md transition-all duration-300">
            <div className="space-y-1">
              <Label htmlFor="tts" className="text-sm font-semibold text-blue-700 dark:text-blue-300">Text to Speech</Label>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                Enable voice output
              </p>
            </div>
            <Switch
              id="tts"
              checked={localSettings.enableTTS}
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, enableTTS: checked }))}
              data-testid="switch-tts"
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-cyan-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 border-2 border-gray-300 dark:border-gray-600 hover:border-red-400 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300"
              data-testid="button-reset-settings"
            >
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              data-testid="button-save-settings"
            >
              Save Changes
            </Button>
          </div>
          </TabsContent>

          <TabsContent value="persona" className="space-y-6 mt-4">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              🎭 AI Persona
            </h3>

            {/* Quick Presets */}
            <div className="mb-4 space-y-3 p-4 rounded-xl bg-gradient-to-br from-white/70 to-indigo-50/50 dark:from-slate-800/50 dark:to-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/50">
              <Label className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Quick Presets</Label>
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
                  className="text-xs border-emerald-200 dark:border-emerald-800 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-950/50 dark:hover:to-teal-950/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300"
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
                  className="text-xs border-blue-200 dark:border-blue-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/50 dark:hover:to-indigo-950/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
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
                  className="text-xs border-purple-200 dark:border-purple-800 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/50 dark:hover:to-pink-950/50 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300"
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
                  className="text-xs border-pink-200 dark:border-pink-800 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 dark:hover:from-pink-950/50 dark:hover:to-rose-950/50 hover:border-pink-300 dark:hover:border-pink-700 transition-all duration-300"
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
                  className="text-xs border-amber-200 dark:border-amber-800 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-950/50 dark:hover:to-orange-950/50 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300"
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
                  className="text-xs border-cyan-200 dark:border-cyan-800 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-sky-50 dark:hover:from-cyan-950/50 dark:hover:to-sky-950/50 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all duration-300"
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

            {/* Action Buttons for Persona Tab */}
            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1 border-2 border-gray-300 dark:border-gray-600 hover:border-red-400 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300"
                data-testid="button-reset-settings"
              >
                Reset to Defaults
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
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
              
              {/* Action Buttons for Performance Tab */}
              <div className="mt-6 flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleReset} 
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600 hover:border-red-400 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300"
                >
                  Reset to Defaults
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="storage" className="mt-4 space-y-4">
            {/* Admin Panel Access Hint (for developers) */}
            {import.meta.env.DEV && adminKeyCount > 0 && adminKeyCount < 5 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                Press 'A' {5 - adminKeyCount} more time{5 - adminKeyCount !== 1 ? 's' : ''} for admin panel...
              </div>
            )}

            {/* Only load CacheDebugger in development */}
            {import.meta.env.DEV && (
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading debugger...</div>}>
                <CacheDebugger />
              </Suspense>
            )}
            <StorageManagementPanel />
          </TabsContent>
        </Tabs>
      </SheetContent>

      {/* Admin Panel for Custom Models */}
      <AdminPanel 
        open={showAdminPanel} 
        onClose={() => setShowAdminPanel(false)} 
      />

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
