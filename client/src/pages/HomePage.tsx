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
  WifiOff,
  PlayCircle,
  ExternalLink,
  Database,
  Code2,
  Boxes,
  Palette
} from "lucide-react";

export function HomePage() {
  const [, setLocation] = useLocation();
  // Update this constant with your YouTube tutorial link when ready
  const YT_TUTORIAL_URL = "https://www.youtube.com/watch?v=Wa6PZKJFjtw";
  const tutorialEnabled = !!YT_TUTORIAL_URL && !YT_TUTORIAL_URL.includes("REPLACE_WITH_VIDEO_ID");
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black">
      {/* AI Robot-Style Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Digital grid pattern */}
        <div className="digital-grid"></div>
        
        {/* AI Circuit boards */}
        <div className="circuit-board circuit-1"></div>
        <div className="circuit-board circuit-2"></div>
        
        {/* Holographic orbs with AI pulse */}
        <div className="ai-orb ai-orb-1"></div>
        <div className="ai-orb ai-orb-2"></div>
        <div className="ai-orb ai-orb-3"></div>
        
        {/* Data streams */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`stream-${i}`}
            className="data-stream"
            style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
        
        {/* Neural network connections */}
        <div className="neural-network">
          {[...Array(20)].map((_, i) => (
            <div
              key={`node-${i}`}
              className="neural-node"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        
        {/* AI Scanline sweep */}
        <div className="ai-scanline"></div>
        
        {/* Glitch effect overlay */}
        <div className="glitch-overlay"></div>
      </div>

      {/* Hero Section - Enhanced 3D */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* 3D Logo & Title */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-2xl p-12 rounded-full shadow-2xl border border-gray-700/50 hero-logo-3d">
                  <div className="relative">
                    <Brain className="h-24 w-24 text-blue-400 drop-shadow-2xl" 
                           style={{ filter: "drop-shadow(0 0 20px rgb(96 165 250))" }} />
                    <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400" 
                              style={{ filter: "drop-shadow(0 0 10px rgb(250 204 21))", animation: "pulse 2s ease-in-out infinite" }} />
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl"
                style={{ 
                  textShadow: "0 0 80px rgba(147, 51, 234, 0.5)",
                  backgroundSize: "200% auto",
                  animation: "gradient-shift 3s ease-in-out infinite"
                }}>
              HR AI MIND
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-300 font-medium drop-shadow-lg">
              Your Personal AI Assistant - Powered by Advanced Language Models
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="secondary" className="text-sm px-4 py-2 bg-white/80 dark:bg-white/70 backdrop-blur-2xl border border-gray-300/50 dark:border-gray-200/30 shadow-lg hover:scale-105 transition-all tech-icon-glow text-gray-900 dark:text-gray-900">
                <WifiOff className="h-4 w-4 mr-2 text-gray-900" />
                100% Offline
              </Badge>
              <Badge variant="secondary" className="text-sm px-4 py-2 bg-white/80 dark:bg-white/70 backdrop-blur-2xl border border-gray-300/50 dark:border-gray-200/30 shadow-lg hover:scale-105 transition-all tech-icon-glow text-gray-900 dark:text-gray-900">
                <Shield className="h-4 w-4 mr-2 text-gray-900" />
                Privacy First
              </Badge>
              <Badge variant="secondary" className="text-sm px-4 py-2 bg-white/80 dark:bg-white/70 backdrop-blur-2xl border border-gray-300/50 dark:border-gray-200/30 shadow-lg hover:scale-105 transition-all tech-icon-glow text-gray-900 dark:text-gray-900">
                <Zap className="h-4 w-4 mr-2 text-gray-900" />
                WebGPU Powered
              </Badge>
            </div>
          </div>

          {/* CTA Buttons - Perfectly Centered */}
          <div className="pt-6 flex justify-center">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-2xl">
              <Button 
                size="lg" 
                onMouseEnter={() => { import("@/pages/ChatPage").catch(() => {}); }}
                onFocus={() => { import("@/pages/ChatPage").catch(() => {}); }}
                onClick={() => setLocation("/chat")}
                className="unique-morph-btn relative text-xl px-10 py-7 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-all shadow-2xl w-full sm:w-auto group overflow-hidden border-none"
                style={{ 
                  boxShadow: "0 20px 60px rgba(147, 51, 234, 0.4)",
                  transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
                }}
              >
                {/* Liquid morphing background layers */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700">
                  {/* Layer 1 - Expanding circles */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 group-hover:w-[200%] group-hover:h-[200%] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-2xl opacity-30 transition-all duration-700"></div>
                  {/* Layer 2 - Rotating gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-40" 
                       style={{ animation: "spin 3s linear infinite" }}></div>
                  {/* Layer 3 - Wave effect */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_50%)]"
                       style={{ animation: "wave-pulse 2s ease-in-out infinite" }}></div>
                </div>
                
                {/* Particle burst effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                        animation: `particle-explode 0.8s ease-out ${i * 0.05}s infinite`
                      }}
                    ></div>
                  ))}
                </div>
                
                <div className="relative flex items-center justify-center gap-3 z-10">
                  <MessageSquare className="h-6 w-6 group-hover:scale-125 group-hover:rotate-[360deg] transition-all duration-700" />
                  <span className="font-bold tracking-wide group-hover:tracking-wider transition-all duration-300">Start Chatting Now</span>
                  <Sparkles className="h-6 w-6 group-hover:scale-125 group-hover:rotate-[-360deg] transition-all duration-700" 
                            style={{ filter: "drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))" }} />
                </div>
              </Button>

              {/* Watch Tutorial button - Official YouTube Style */}
              {tutorialEnabled ? (
                <Button
                  size="lg"
                  asChild
                  className="relative text-xl px-10 py-7 w-full sm:w-auto bg-[#FF0000] hover:bg-[#CC0000] text-white border-none shadow-2xl group overflow-visible"
                  data-testid="watch-tutorial-button"
                  style={{ 
                    boxShadow: "0 8px 24px rgba(255, 0, 0, 0.35)",
                    transition: "all 0.3s ease",
                    borderRadius: "4px"
                  }}
                >
                  <a href={YT_TUTORIAL_URL} target="_blank" rel="noopener noreferrer" aria-label="Watch Tutorial on YouTube" className="flex items-center justify-center gap-3">
                    {/* YouTube Official Play Button Icon */}
                    <div className="relative flex items-center justify-center">
                      <svg 
                        className="w-8 h-8 group-hover:scale-105 transition-transform duration-200" 
                        viewBox="0 0 24 24" 
                        fill="none"
                      >
                        {/* YouTube rounded rectangle background */}
                        <rect x="2" y="5" width="20" height="14" rx="3" fill="white" opacity="0.95"/>
                        {/* Play triangle */}
                        <path d="M10 8.5L15 12L10 15.5V8.5Z" fill="#FF0000"/>
                      </svg>
                    </div>
                    <span className="font-semibold tracking-normal">Watch Tutorial</span>
                  </a>
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  disabled
                  className="text-xl px-10 py-7 w-full sm:w-auto opacity-50 cursor-not-allowed border-2 border-gray-700"
                  aria-disabled
                  title="Tutorial coming soon"
                  data-testid="watch-tutorial-button-disabled"
                >
                  <PlayCircle className="h-6 w-6 mr-3" />
                  Watch Tutorial (Coming Soon)
                </Button>
              )}
            </div>
          </div>

          {/* Tutorial Thumbnail - Enhanced 3D */}
          <div className="mt-10 flex justify-center">
            {tutorialEnabled ? (
              <a
                href={YT_TUTORIAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group block w-full max-w-4xl transform hover:scale-[1.02] transition-all duration-500"
                aria-label="Watch the tutorial on YouTube"
                data-testid="tutorial-thumbnail"
              >
                <div className="relative aspect-video overflow-hidden rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl"
                     style={{ 
                       boxShadow: "0 25px 80px rgba(0, 0, 0, 0.5), 0 0 60px rgba(147, 51, 234, 0.3)",
                       transform: "perspective(1000px) rotateX(2deg)"
                     }}>
                  <img
                    src="/tutorial-thumbnail.jpg"
                    alt="HR AI Mind Tutorial"
                    className="absolute inset-0 h-full w-full object-cover brightness-125 contrast-110"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-black/10 to-transparent group-hover:via-black/20 transition-all">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl"></div>
                      <PlayCircle className="relative h-28 w-28 text-white drop-shadow-2xl group-hover:scale-110 transition-transform" 
                                  style={{ filter: "drop-shadow(0 0 40px rgb(255 255 255))" }} />
                    </div>
                  </div>
                </div>
              </a>
            ) : (
              <div
                className="group block w-full max-w-4xl cursor-not-allowed opacity-60"
                aria-disabled
                data-testid="tutorial-thumbnail-disabled"
              >
                <div className="relative aspect-video overflow-hidden rounded-3xl border-2 border-gray-700 bg-gradient-to-br from-gray-900 via-black to-gray-900"
                     style={{ boxShadow: "0 25px 80px rgba(0, 0, 0, 0.7)" }}>
                  <img
                    src="/tutorial-thumbnail.jpg"
                    alt="HRAI Mind Tutorial (Coming Soon)"
                    className="absolute inset-0 h-full w-full object-cover brightness-100 contrast-105"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4 text-white bg-black/40 px-8 py-4 rounded-2xl border border-white/10">
                      <PlayCircle className="h-16 w-16 opacity-90" />
                      <span className="text-2xl font-semibold">Tutorial Coming Soon</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Grid - Clean & Eye-Friendly */}
      <div className="container mx-auto px-4 py-20 relative z-10 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Why Choose HR AI Mind?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: WifiOff, title: "Fully Offline", desc: "No internet required after setup. Your conversations stay on your device.", bgColor: "bg-blue-900/20", borderColor: "border-blue-500/30", iconColor: "text-blue-400", iconBg: "bg-blue-500/10" },
              { icon: Shield, title: "Privacy Protected", desc: "Zero data collection. Your conversations never leave your browser.", bgColor: "bg-purple-900/20", borderColor: "border-purple-500/30", iconColor: "text-purple-400", iconBg: "bg-purple-500/10" },
              { icon: Zap, title: "Lightning Fast", desc: "WebGPU acceleration delivers instant responses without cloud delays.", bgColor: "bg-pink-900/20", borderColor: "border-pink-500/30", iconColor: "text-pink-400", iconBg: "bg-pink-500/10" },
              { icon: Brain, title: "Advanced AI", desc: "Powered by cutting-edge Llama models running directly in your browser.", bgColor: "bg-green-900/20", borderColor: "border-green-500/30", iconColor: "text-green-400", iconBg: "bg-green-500/10" },
              { icon: Rocket, title: "Progressive Web App", desc: "Install on any device. Works like a native app with offline support.", bgColor: "bg-orange-900/20", borderColor: "border-orange-500/30", iconColor: "text-orange-400", iconBg: "bg-orange-500/10" },
              { icon: Cpu, title: "Multiple Models", desc: "Choose from multiple AI models based on your performance needs.", bgColor: "bg-indigo-900/20", borderColor: "border-indigo-500/30", iconColor: "text-indigo-400", iconBg: "bg-indigo-500/10" },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className={`${feature.bgColor} ${feature.borderColor} border-2 backdrop-blur-sm hover:border-opacity-60 transition-all duration-300 group hover:shadow-xl feature-card-glow`}
              >
                <CardHeader className="space-y-4">
                  <div className={`w-14 h-14 rounded-xl ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform particle-trail`}>
                    <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl text-white font-semibold">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-400 leading-relaxed">
                    {feature.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Tech Stack - 3D Icon Grid */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <Card className="border-2 border-gray-700/50 bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-black/50 backdrop-blur-2xl shadow-2xl"
                style={{ 
                  boxShadow: "0 25px 80px rgba(0, 0, 0, 0.5), 0 0 60px rgba(147, 51, 234, 0.2)",
                  transform: "perspective(1000px) rotateX(3deg)"
                }}>
            <CardHeader>
              <CardTitle className="text-3xl text-center text-white mb-8">Built with Modern Technology</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { name: "WebLLM", icon: Brain, color: "from-blue-500 to-cyan-500", shadow: "rgba(59, 130, 246, 0.4)" },
                  { name: "WebGPU", icon: Cpu, color: "from-purple-500 to-pink-500", shadow: "rgba(147, 51, 234, 0.4)" },
                  { name: "React 18", icon: Code2, color: "from-cyan-500 to-blue-500", shadow: "rgba(6, 182, 212, 0.4)" },
                  { name: "TypeScript", icon: Code2, color: "from-blue-600 to-indigo-600", shadow: "rgba(37, 99, 235, 0.4)" },
                  { name: "Vite", icon: Zap, color: "from-purple-600 to-pink-600", shadow: "rgba(147, 51, 234, 0.4)" },
                  { name: "Tailwind CSS", icon: Palette, color: "from-cyan-400 to-teal-500", shadow: "rgba(20, 184, 166, 0.4)" },
                  { name: "IndexedDB", icon: Database, color: "from-green-500 to-emerald-500", shadow: "rgba(34, 197, 94, 0.4)" },
                  { name: "Service Workers", icon: Boxes, color: "from-orange-500 to-red-500", shadow: "rgba(249, 115, 22, 0.4)" },
                ].map((tech, idx) => (
                  <div
                    key={idx}
                    className="group relative tech-icon-glow"
                    style={{ animation: `float ${4 + (idx % 3)}s ease-in-out infinite`, animationDelay: `${idx * 0.2}s` }}
                  >
                    <div className={`relative p-6 rounded-2xl bg-gradient-to-br ${tech.color} shadow-lg transition-all duration-500 border border-white/10`}
                         style={{ 
                           boxShadow: `0 10px 40px ${tech.shadow}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                           transform: "perspective(500px) rotateX(10deg) rotateY(-5deg)"
                         }}>
                      <tech.icon className="h-10 w-10 text-white mx-auto mb-3 drop-shadow-lg" 
                                 style={{ filter: "drop-shadow(0 0 15px rgba(255, 255, 255, 0.5))" }} />
                      <p className="text-white font-semibold text-center text-sm">{tech.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Portfolio Link Section - Animated */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <a
            href="https://www.hraimind.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block gradient-border-animate"
          >
            <div className="relative overflow-hidden rounded-3xl border-2 border-gray-700/50 bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 backdrop-blur-xl p-12 hover:scale-[1.02] transition-all duration-500 shadow-2xl hover-spotlight"
                 style={{ 
                   boxShadow: "0 25px 80px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                   transform: "perspective(1000px) rotateX(2deg)"
                 }}>
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{ animation: "shimmer 3s infinite linear" }}></div>
              
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
                    <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" 
                              style={{ filter: "drop-shadow(0 0 10px rgb(250 204 21))" }} />
                    <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Explore My Work
                    </h3>
                  </div>
                  <p className="text-xl text-gray-300 mb-4">
                    Discover more innovative projects and what I build
                  </p>
                  <div className="flex items-center gap-2 justify-center md:justify-start text-purple-400 font-semibold group-hover:text-purple-300 transition-colors">
                    <span className="text-lg">Visit Portfolio</span>
                    <ExternalLink className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity"
                       style={{ animation: "pulse 2s ease-in-out infinite" }}></div>
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 flex items-center justify-center border-2 border-gray-700/50 shadow-2xl group-hover:scale-110 transition-transform">
                    <ExternalLink className="h-12 w-12 text-purple-400" 
                                  style={{ filter: "drop-shadow(0 0 15px rgba(168, 85, 247, 0.5))" }} />
                  </div>
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Footer CTA - Enhanced */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              style={{ textShadow: "0 0 80px rgba(147, 51, 234, 0.5)" }}>
            Ready to Experience the Future?
          </h2>
          <p className="text-xl text-gray-300">
            Start chatting with AI that respects your privacy and works offline.
          </p>
          <Button 
            size="lg" 
            onMouseEnter={() => { import("@/pages/ChatPage").catch(() => {}); }}
            onFocus={() => { import("@/pages/ChatPage").catch(() => {}); }}
            onClick={() => setLocation("/chat")}
            className="unique-morph-btn relative text-xl px-12 py-7 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-all shadow-2xl group overflow-hidden border-none"
            style={{ 
              boxShadow: "0 20px 60px rgba(147, 51, 234, 0.4)",
              transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
          >
            {/* Liquid morphing background layers */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700">
              {/* Layer 1 - Expanding circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 group-hover:w-[200%] group-hover:h-[200%] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-2xl opacity-30 transition-all duration-700"></div>
              {/* Layer 2 - Rotating gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-40" 
                   style={{ animation: "spin 3s linear infinite" }}></div>
              {/* Layer 3 - Wave effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_50%)]"
                   style={{ animation: "wave-pulse 2s ease-in-out infinite" }}></div>
            </div>
            
            {/* Particle burst effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                    animation: `particle-explode 0.8s ease-out ${i * 0.05}s infinite`
                  }}
                ></div>
              ))}
            </div>
            
            <div className="relative flex items-center justify-center gap-3 z-10">
              <Rocket className="h-6 w-6 group-hover:scale-125 group-hover:rotate-[360deg] transition-all duration-700" />
              <span className="font-bold tracking-wide group-hover:tracking-wider transition-all duration-300">Launch HR AI Mind</span>
              <Sparkles className="h-6 w-6 group-hover:scale-125 group-hover:rotate-[-360deg] transition-all duration-700" 
                        style={{ filter: "drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))" }} />
            </div>
          </Button>
        </div>
      </div>

      {/* Advanced GSAP-Style CSS Animations - Fully Offline */}
      <style>{`
        /* GSAP-like Orb Animations */
        .gsap-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          will-change: transform, opacity;
        }
        
        .gsap-orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.4) 50%, transparent 100%);
          top: -10%;
          left: -10%;
          animation: orbit1 25s ease-in-out infinite, pulse-glow 4s ease-in-out infinite;
        }
        
        .gsap-orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, rgba(126, 34, 206, 0.4) 50%, transparent 100%);
          bottom: -5%;
          right: -5%;
          animation: orbit2 30s ease-in-out infinite reverse, pulse-glow 5s ease-in-out infinite 0.5s;
        }
        
        .gsap-orb-3 {
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, rgba(219, 39, 119, 0.3) 50%, transparent 100%);
          top: 30%;
          right: 10%;
          animation: orbit3 35s ease-in-out infinite, pulse-glow 6s ease-in-out infinite 1s;
        }
        
        .gsap-orb-4 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.7) 0%, rgba(3, 105, 161, 0.4) 50%, transparent 100%);
          bottom: 20%;
          left: 15%;
          animation: orbit4 28s ease-in-out infinite reverse, pulse-glow 5.5s ease-in-out infinite 1.5s;
        }
        
        .gsap-orb-5 {
          width: 550px;
          height: 550px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.7) 0%, rgba(109, 40, 217, 0.3) 50%, transparent 100%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: breathe 20s ease-in-out infinite, rotate-slow 40s linear infinite;
        }
        
        /* Gradient Mesh */
        .gradient-mesh {
          width: 200%;
          height: 200%;
          background: 
            linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, transparent 40%),
            linear-gradient(-45deg, rgba(168, 85, 247, 0.1) 0%, transparent 40%),
            linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, transparent 40%);
          animation: mesh-flow 30s ease-in-out infinite;
        }
        
        /* Particle System */
        .particle {
          position: absolute;
          background: radial-gradient(circle, rgba(147, 197, 253, 0.8) 0%, transparent 70%);
          border-radius: 50%;
          animation: particle-float 10s ease-in-out infinite;
          will-change: transform, opacity;
        }
        
        /* Scanline Effect */
        .scanline {
          position: absolute;
          width: 100%;
          height: 3px;
          background: linear-gradient(transparent, rgba(59, 130, 246, 0.3), transparent);
          animation: scan 8s linear infinite;
          top: 0;
        }
        
        /* Keyframe Animations */
        @keyframes orbit1 {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          25% { 
            transform: translate(100px, -50px) scale(1.1);
            opacity: 0.5;
          }
          50% { 
            transform: translate(150px, 50px) scale(1.05);
            opacity: 0.45;
          }
          75% { 
            transform: translate(50px, 100px) scale(0.95);
            opacity: 0.4;
          }
        }
        
        @keyframes orbit2 {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 0.4;
          }
          33% { 
            transform: translate(-80px, -100px) rotate(120deg) scale(1.08);
            opacity: 0.5;
          }
          66% { 
            transform: translate(-120px, 80px) rotate(240deg) scale(0.98);
            opacity: 0.45;
          }
        }
        
        @keyframes orbit3 {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.35;
          }
          50% { 
            transform: translate(-100px, 100px) scale(1.1);
            opacity: 0.45;
          }
        }
        
        @keyframes orbit4 {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.4;
          }
          50% { 
            transform: translate(120px, -80px) rotate(180deg);
            opacity: 0.5;
          }
        }
        
        @keyframes breathe {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.15);
            opacity: 0.5;
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            filter: blur(80px) brightness(1);
          }
          50% { 
            filter: blur(100px) brightness(1.2);
          }
        }
        
        @keyframes rotate-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes mesh-flow {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% { 
            transform: translate(-10%, -10%) rotate(5deg);
            opacity: 0.8;
          }
        }
        
        @keyframes particle-float {
          0% { 
            transform: translateY(0) translateX(0) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-20px) translateX(10px) scale(1);
          }
          90% {
            opacity: 1;
            transform: translateY(-80vh) translateX(calc(-50px + var(--x-offset, 0px))) scale(0.8);
          }
          100% { 
            transform: translateY(-100vh) translateX(calc(-50px + var(--x-offset, 0px))) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        /* Performance optimizations */
        .gsap-orb, .particle, .gradient-mesh, .scanline {
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
