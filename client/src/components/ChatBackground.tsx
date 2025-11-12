export function ChatBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950" />
      
      {/* Animated mesh gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-300/20 to-blue-400/20 dark:from-cyan-600/20 dark:to-blue-700/20 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '4s' }} />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-300/20 to-pink-400/20 dark:from-purple-600/20 dark:to-pink-700/20 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '5s', animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-br from-indigo-300/20 to-violet-400/20 dark:from-indigo-600/20 dark:to-violet-700/20 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '6s', animationDelay: '2s' }} />
      
      {/* Floating geometric shapes */}
      <div className="absolute top-1/4 right-1/3 w-32 h-32 border-2 border-blue-300/30 dark:border-blue-600/30 rounded-lg rotate-45 animate-spin-slow" 
           style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border-2 border-purple-300/30 dark:border-purple-600/30 rounded-full animate-bounce-slow"
           style={{ animationDuration: '8s' }} />
      <div className="absolute top-2/3 left-1/4 w-20 h-20 border-2 border-pink-300/30 dark:border-pink-600/30 rotate-12 animate-pulse"
           style={{ animationDuration: '7s' }} />
      
      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(rgba(100, 100, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(100, 100, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-white/30 dark:to-black/30" />
    </div>
  );
}
