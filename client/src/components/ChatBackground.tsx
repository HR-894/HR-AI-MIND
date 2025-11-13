export function ChatBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Soft gradient base - Eye-comfortable colors with vibrant dark mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/80 dark:from-slate-900 dark:via-indigo-900/70 dark:to-purple-900/60" />
      
      {/* Gentle floating orbs - More vibrant in dark mode */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-200/15 via-cyan-200/10 to-transparent dark:from-blue-500/20 dark:via-cyan-500/15 dark:to-transparent rounded-full blur-3xl animate-float" 
           style={{ animationDuration: '15s' }} />
      <div className="absolute top-1/3 right-1/5 w-[450px] h-[450px] bg-gradient-to-br from-purple-200/15 via-pink-200/10 to-transparent dark:from-purple-500/20 dark:via-pink-500/15 dark:to-transparent rounded-full blur-3xl animate-float-delayed" 
           style={{ animationDuration: '18s', animationDelay: '3s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-indigo-200/15 via-violet-200/10 to-transparent dark:from-indigo-500/18 dark:via-violet-500/12 dark:to-transparent rounded-full blur-3xl animate-float-slow" 
           style={{ animationDuration: '20s', animationDelay: '6s' }} />
      <div className="absolute top-2/3 right-1/3 w-[350px] h-[350px] bg-gradient-to-br from-teal-200/12 via-emerald-200/8 to-transparent dark:from-teal-500/16 dark:via-emerald-500/12 dark:to-transparent rounded-full blur-3xl animate-float" 
           style={{ animationDuration: '22s', animationDelay: '9s' }} />
      
      {/* Subtle animated mesh pattern - Enhanced dark mode */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.12]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(236, 72, 153, 0.12) 0%, transparent 50%)
            `,
            backgroundSize: '100% 100%',
            animation: 'mesh-flow 30s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Soft light rays from top - More prominent in dark */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-white/20 via-indigo-100/10 to-transparent dark:from-indigo-400/10 dark:via-purple-400/6 dark:to-transparent blur-2xl" />
      
      {/* Bottom ambient glow - Warmer dark mode */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-purple-100/20 via-pink-100/10 to-transparent dark:from-purple-600/20 dark:via-pink-600/12 dark:to-transparent blur-xl" />
      
      {/* Subtle noise texture for depth */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />
      
      {/* Radial vignette for depth and focus - Softer dark mode */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-slate-100/40 dark:to-slate-900/50" />
    </div>
  );
}
