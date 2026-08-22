import React from 'react';
import { Store, ShieldCheck, Cloud, TrendingUp, Headphones, ArrowRight, UtensilsCrossed, Fish, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

type BusinessSelectorViewProps = {
  onSelectTenant:  (tenantId: string) => void;
  allowedTenants?: string[];
  userRole?:       string;
  onLogout?:       () => void;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.8 }
  }
};

export default function BusinessSelectorView({ onSelectTenant, allowedTenants, userRole, onLogout }: BusinessSelectorViewProps) {
  const canAccess = (tenantId: string) =>
    !allowedTenants || allowedTenants.length === 0 || allowedTenants.includes(tenantId);

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col items-center justify-between lg:justify-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto font-sans custom-scrollbar">
      
      {/* ── Background Image ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      >
        <img src="/fondo-web/fondo-portal.jpg.png" alt="Background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </motion.div>

      {/* ── Barra superior: rol + cerrar sesión ── */}
      {onLogout && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-20 w-full max-w-5xl flex items-center justify-between mb-2"
        >
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">{userRole || 'Usuario'}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white px-4 py-2 rounded-full shadow-sm text-stone-600 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </motion.div>
      )}

      {/* ── Main Content Container ── */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-5xl flex flex-col items-center my-auto py-4"
      >
        
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6 sm:mb-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3 text-blue-600 border border-gray-100">
            <Store className="w-6 h-6" />
          </div>
          
          <span className="px-3.5 py-1 bg-[#e0ebfb] text-[#1e5eb0] text-[11px] font-bold rounded-full mb-3 tracking-widest uppercase">
            Bienvenido
          </span>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-lg">
            Selecciona tu Negocio
          </h1>
          
          <p className="text-white/90 text-xs sm:text-sm md:text-base max-w-xl font-medium leading-relaxed drop-shadow">
            Elige la sucursal a la que deseas ingresar.<br className="hidden sm:block" />
            Los datos operativos están completamente aislados por seguridad.
          </p>
        </motion.div>

        {/* Business Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full px-2 sm:px-0">
          
          {/* ── LAS LOMAS GRILL CARD ── */}
          {canAccess('laslomas') && (
            <div className="bg-white rounded-[2rem] w-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-300 overflow-hidden flex flex-col relative pb-6 group">
              
              <div className="h-36 sm:h-44 w-full relative">
                <img 
                  src="/fondo-web/lomas-grill-meat.jpg" 
                  alt="Grill Interior" 
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/50"></div>
                
                <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute -bottom-1 w-full h-10 sm:h-12 text-white fill-current">
                  <path d="M0,20 Q50,0 100,20 L100,20 L0,20 Z" />
                </svg>
              </div>
              
              <div className="flex justify-center -mt-12 sm:-mt-14 relative z-10">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 sm:border-[6px] border-white shadow-lg overflow-hidden bg-white flex items-center justify-center transition-transform duration-500 group-hover:-translate-y-1.5">
                  <img src="/Logo/logo-lomas-grill.png" alt="Las Lomas Grill" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="px-6 sm:px-8 mt-2 sm:mt-3 flex flex-col items-center flex-1">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Las Lomas Grill</h2>
                
                <div className="flex items-center justify-center gap-3 mb-3 w-full max-w-[180px]">
                  <div className="h-px bg-amber-200 flex-1"></div>
                  <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                  <div className="h-px bg-amber-200 flex-1"></div>
                </div>
                
                <p className="text-center text-gray-500 text-xs sm:text-sm mb-6 leading-relaxed">
                  Ingresa al sistema POS, administración de pedidos, inventario y menú digital de la sede principal.
                </p>
                
                <button 
                  onClick={() => onSelectTenant('laslomas')}
                  className="mt-auto w-full py-3 sm:py-3.5 bg-[#1a1a1a] hover:bg-black text-amber-500 text-xs sm:text-sm font-bold tracking-widest rounded-full flex items-center justify-center gap-3 transition-colors shadow-md cursor-pointer"
                >
                  INGRESAR A SUCURSAL <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── PARADERO 104 CARD ── */}
          {canAccess('paradero') && (
            <div className="bg-white rounded-[2rem] w-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-300 overflow-hidden flex flex-col relative pb-6 group">
              
              <div className="h-36 sm:h-44 w-full relative">
                <img 
                  src="/fondo-web/paradero-seafood.jpg" 
                  alt="Seafood Dish" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-blue-900/30"></div>
                
                <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute -bottom-1 w-full h-10 sm:h-12 text-white fill-current">
                  <path d="M0,20 Q50,0 100,20 L100,20 L0,20 Z" />
                </svg>
              </div>
              
              <div className="flex justify-center -mt-12 sm:-mt-14 relative z-10">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 sm:border-[6px] border-white shadow-lg overflow-hidden bg-white flex items-center justify-center p-2 transition-transform duration-500 group-hover:-translate-y-1.5">
                  <img src="/Logo/logo-paradero-104.png" alt="Paradero 104" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="px-6 sm:px-8 mt-2 sm:mt-3 flex flex-col items-center flex-1">
                <h2 className="text-xl sm:text-2xl font-black text-[#0f4a8a] mb-2">Paradero 104</h2>
                
                <div className="flex items-center justify-center gap-3 mb-3 w-full max-w-[180px]">
                  <div className="h-px bg-blue-100 flex-1"></div>
                  <Fish className="w-4 h-4 text-blue-500" />
                  <div className="h-px bg-blue-100 flex-1"></div>
                </div>
                
                <p className="text-center text-gray-500 text-xs sm:text-sm mb-6 leading-relaxed">
                  Ingresa al sistema POS, administración de pedidos, inventario y menú digital de la sede Paradero 104 - Ceviches.
                </p>
                
                <button 
                  onClick={() => onSelectTenant('paradero')}
                  className="mt-auto w-full py-3 sm:py-3.5 bg-[#1976d2] hover:bg-[#1565c0] text-white text-xs sm:text-sm font-bold tracking-widest rounded-full flex items-center justify-center gap-3 transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  INGRESAR A SUCURSAL <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </motion.div>

        {/* ── Footer Banner ── */}
        <motion.div variants={fadeVariants} className="mt-8 sm:mt-10 bg-white/85 backdrop-blur-md rounded-2xl md:rounded-full shadow-sm py-3.5 px-6 sm:px-8 w-full hidden md:flex items-center justify-between border border-white/60">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-[#101828] text-xs">Seguridad</h4>
              <p className="text-[11px] text-gray-500">Datos aislados</p>
            </div>
          </div>
          
          <div className="w-px h-6 bg-gray-200"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-[#101828] text-xs">Respaldo</h4>
              <p className="text-[11px] text-gray-500">Copias automáticas</p>
            </div>
          </div>
          
          <div className="w-px h-6 bg-gray-200"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-[#101828] text-xs">Rendimiento</h4>
              <p className="text-[11px] text-gray-500">Sistema optimizado</p>
            </div>
          </div>
          
          <div className="w-px h-6 bg-gray-200"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-[#101828] text-xs">Soporte</h4>
              <p className="text-[11px] text-gray-500">Asistencia 24/7</p>
            </div>
          </div>

        </motion.div>

      </motion.div>
    </div>
  );
}
