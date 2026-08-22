import React, { useEffect, useState } from "react";
import { useAppStore } from "../../hooks/StoreContext";

export default function LoadingScreen() {
  const { settings } = useAppStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Retraso muy corto para activar la animación de entrada
    setTimeout(() => setShow(true), 50);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
      
      {/* Fondo dinámico y elegante */}
      <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay transition-opacity duration-700 ${show ? 'opacity-30' : 'opacity-0'}`}></div>
      
      {/* Brillos con colores de la marca elegida */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] ${settings.companyName.includes("Lomas") ? 'bg-amber-600/10' : 'bg-blue-600/10'} rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ${show ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}></div>

      <div className="relative z-10 flex flex-col items-center">
        
        {/* Contenedor del Logo con pulso elegante */}
        <div className={`w-28 h-28 md:w-36 md:h-36 bg-gradient-to-b from-stone-800 to-stone-950 rounded-[2rem] shadow-2xl flex items-center justify-center p-6 mb-8 relative border border-stone-700/50 transition-all duration-700 transform ${show ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-10 scale-90 opacity-0'}`}>
           <img 
            src={settings.logoUrl && settings.logoUrl !== "/icono.png" ? settings.logoUrl : "/logo-web.png"} 
            alt="Logo" 
            className="w-full h-full object-contain drop-shadow-lg relative z-10 animate-[pulse_2s_ease-in-out_infinite]"
          />
          {/* Anillo giratorio de alta gama */}
          <div className={`absolute inset-0 rounded-[2rem] border-[3px] border-transparent ${settings.companyName.includes("Lomas") ? 'border-t-amber-500 border-l-amber-500' : 'border-t-blue-500 border-l-blue-500'} animate-[spin_1.5s_linear_infinite] opacity-70`}></div>
          <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] pointer-events-none"></div>
        </div>

        {/* Texto de conexión */}
        <h2 className={`text-3xl font-black text-white tracking-tight mb-2 transition-all duration-700 delay-150 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {settings.companyName}
        </h2>
        
        <p className={`text-stone-400 font-medium tracking-widest text-sm uppercase transition-all duration-700 delay-300 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          Sincronizando Sistema...
        </p>
        
        {/* Barra de progreso minimalista */}
        <div className={`mt-8 w-48 h-1 bg-stone-900 rounded-full overflow-hidden transition-all duration-700 delay-500 opacity-100 ${show ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`h-full ${settings.companyName.includes("Lomas") ? 'bg-amber-500' : 'bg-blue-500'} rounded-full animate-[loading_1s_ease-in-out_forwards]`}></div>
        </div>

      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
