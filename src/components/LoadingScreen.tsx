import React from "react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl shadow-amber-500/10 flex items-center justify-center p-4 mb-8 relative border border-stone-200/50 dark:border-stone-800/50">
           <img 
            src="/carga.png" 
            alt="Cargando..." 
            className="w-full h-full object-contain drop-shadow-md animate-pulse"
          />
          <div className="absolute inset-0 rounded-[2rem] border-2 border-amber-500/20 dark:border-amber-400/20 animate-[spin_3s_linear_infinite] [mask-image:linear-gradient(transparent,black)]"></div>
        </div>

        <h2 className="text-2xl font-display font-bold text-stone-900 dark:text-white mb-4 tracking-tight">
          Preparando tu espacio
        </h2>
        
        <div className="flex space-x-1.5 bg-white dark:bg-stone-900/50 px-4 py-2.5 rounded-full shadow-sm border border-stone-200/50 dark:border-stone-800/50 backdrop-blur-sm">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
