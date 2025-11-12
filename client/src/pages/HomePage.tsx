import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Zap, 
  Shield, 
  Download, 
  Cpu, 
  MessageSquare,
  Brain,
  Rocket,
  Lock,
  Wifi,
  WifiOff
} from "lucide-react";

export function HomePage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gray-800/50 backdrop-blur-xl p-8 rounded-full shadow-2xl border border-gray-700">
                  <Brain className="h-20 w-20 text-blue-400" />
                  <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-bounce" />
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              HR AI MIND
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 font-medium">
              Your Personal AI Assistant - Powered by Advanced Language Models
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <WifiOff className="h-3 w-3 mr-1" />
                100% Offline
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Shield className="h-3 w-3 mr-1" />
                Privacy First
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Zap className="h-3 w-3 mr-1" />
                WebGPU Powered
              </Badge>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button 
              size="lg" 
              onClick={() => setLocation("/chat")}
              className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 transition-opacity shadow-2xl"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Start Chatting Now
              <Sparkles className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Why Choose HR AI Mind?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-2 border-gray-700 hover:border-blue-500 transition-colors bg-gray-800/50 backdrop-blur-xl">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center mb-3">
                  <WifiOff className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-xl text-white">Fully Offline</CardTitle>
                <CardDescription className="text-gray-400">
                  No internet required after setup. Your conversations stay on your device.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 border-gray-700 hover:border-purple-500 transition-colors bg-gray-800/50 backdrop-blur-xl">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-purple-900/50 flex items-center justify-center mb-3">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
                <CardTitle className="text-xl text-white">Privacy Protected</CardTitle>
                <CardDescription className="text-gray-400">
                  Zero data collection. Your conversations never leave your browser.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 border-gray-700 hover:border-pink-500 transition-colors bg-gray-800/50 backdrop-blur-xl">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-pink-900/50 flex items-center justify-center mb-3">
                  <Zap className="h-6 w-6 text-pink-400" />
                </div>
                <CardTitle className="text-xl text-white">Lightning Fast</CardTitle>
                <CardDescription className="text-gray-400">
                  WebGPU acceleration delivers instant responses without cloud delays.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 border-gray-700 hover:border-green-500 transition-colors bg-gray-800/50 backdrop-blur-xl">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-900/50 flex items-center justify-center mb-3">
                  <Brain className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white">Advanced AI</CardTitle>
                <CardDescription className="text-gray-400">
                  Powered by cutting-edge Llama models running directly in your browser.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="border-2 border-gray-700 hover:border-orange-500 transition-colors bg-gray-800/50 backdrop-blur-xl">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-orange-900/50 flex items-center justify-center mb-3">
                  <Rocket className="h-6 w-6 text-orange-400" />
                </div>
                <CardTitle className="text-xl text-white">Progressive Web App</CardTitle>
                <CardDescription className="text-gray-400">
                  Install on any device. Works like a native app with offline support.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="border-2 border-gray-700 hover:border-indigo-500 transition-colors bg-gray-800/50 backdrop-blur-xl">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-indigo-900/50 flex items-center justify-center mb-3">
                  <Cpu className="h-6 w-6 text-indigo-400" />
                </div>
                <CardTitle className="text-xl text-white">Multiple Models</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose from multiple AI models based on your performance needs.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-white">Built with Modern Technology</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Badge variant="outline" className="text-sm px-4 py-2 border-gray-600 text-gray-300">WebLLM</Badge>
                <Badge variant="outline" className="text-sm px-4 py-2 border-gray-600 text-gray-300">WebGPU</Badge>
                <Badge variant="outline" className="text-sm px-4 py-2 border-gray-600 text-gray-300">React 18</Badge>
                <Badge variant="outline" className="text-sm px-4 py-2 border-gray-600 text-gray-300">TypeScript</Badge>
                <Badge variant="outline" className="text-sm px-4 py-2 border-gray-600 text-gray-300">Vite</Badge>
                <Badge variant="outline" className="text-sm px-4 py-2 border-gray-600 text-gray-300">Tailwind CSS</Badge>
                <Badge variant="outline" className="text-sm px-4 py-2 border-gray-600 text-gray-300">IndexedDB</Badge>
                <Badge variant="outline" className="text-sm px-4 py-2 border-gray-600 text-gray-300">Service Workers</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Ready to Experience the Future?
          </h2>
          <p className="text-lg text-gray-300">
            Start chatting with AI that respects your privacy and works offline.
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation("/chat")}
            className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 transition-opacity shadow-2xl"
          >
            <Rocket className="h-5 w-5 mr-2" />
            Launch HR AI Mind
          </Button>
        </div>
      </div>
    </div>
  );
}
