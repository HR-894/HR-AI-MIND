export function AIBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950" />
      
      {/* 3D floating orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-delayed" />
      <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-slow" />
      
      {/* Neural network nodes */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50 animate-pulse-glow-delayed" />
        <div className="absolute bottom-1/3 left-1/2 w-5 h-5 bg-pink-500 rounded-full shadow-lg shadow-pink-500/50 animate-pulse-glow-slow" />
        <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50 animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50 animate-pulse-glow-delayed" />
        
        {/* Connecting lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0 }} />
              <stop offset="50%" style={{ stopColor: 'rgb(147, 51, 234)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgb(236, 72, 153)', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <line x1="25%" y1="25%" x2="33%" y2="50%" stroke="url(#grad1)" strokeWidth="2" className="animate-draw-line" />
          <line x1="67%" y1="33%" x2="50%" y2="50%" stroke="url(#grad1)" strokeWidth="2" className="animate-draw-line-delayed" />
          <line x1="33%" y1="50%" x2="50%" y2="67%" stroke="url(#grad1)" strokeWidth="2" className="animate-draw-line-slow" />
          <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="url(#grad1)" strokeWidth="2" className="animate-draw-line" />
        </svg>
      </div>
      
      {/* Floating geometric shapes */}
      <div className="absolute top-1/3 left-1/5 w-32 h-32 border-4 border-blue-400/30 rounded-lg rotate-45 animate-spin-slow" />
      <div className="absolute bottom-1/4 right-1/5 w-40 h-40 border-4 border-purple-400/30 rounded-full animate-spin-reverse" />
      <div className="absolute top-2/3 left-2/3 w-24 h-24 border-4 border-pink-400/30 rotate-12 animate-float" 
           style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Light rays */}
      <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-blue-400/20 via-transparent to-transparent animate-ray" />
      <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-purple-400/20 via-transparent to-transparent animate-ray-delayed" />
    </div>
  );
}
