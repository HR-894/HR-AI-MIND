import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X } from "lucide-react";
import type { Settings } from "@shared/schema";
import { DEFAULT_SETTINGS } from "@shared/schema";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function SettingsPanel({ open, onClose, settings, onSave }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

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

        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="model">Model</Label>
            <Select
              value={localSettings.modelId}
              onValueChange={(value) => setLocalSettings(prev => ({ ...prev, modelId: value }))}
            >
              <SelectTrigger id="model" data-testid="select-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Llama-3.2-1B-Instruct-q4f32_1-MLC">
                  Llama 3.2 1B (Fast)
                </SelectItem>
                <SelectItem value="Llama-3.2-3B-Instruct-q4f32_1-MLC">
                  Llama 3.2 3B (Balanced)
                </SelectItem>
                <SelectItem value="Phi-3.5-mini-instruct-q4f16_1-MLC">
                  Phi 3.5 Mini
                </SelectItem>
              </SelectContent>
            </Select>
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
      </SheetContent>
    </Sheet>
  );
}
