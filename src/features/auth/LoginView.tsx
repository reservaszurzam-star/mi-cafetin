import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2, Coffee, Utensils, Calculator, BarChart2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

type LoginResult = {
  tenants: string[];
  role: string;
  email: string;
  userId: string;
};

type Props = {
  onLoginSuccess: (result: LoginResult) => void;
};

export default function LoginView({ onLoginSuccess }: Props) {
  const [identifier, setIdentifier]     = useState('');
  const [password, setPassword]         = useState('');
  const [rememberMe, setRememberMe]     = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [infoMessage, setInfoMessage]   = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const trimmed = identifier.trim().toLowerCase();
      const trimmedPassword = password.trim();
      const finalEmail = trimmed.includes('@') ? trimmed : `${trimmed}@cafetin.com`;

      // 1. Intentar autenticar con Supabase Auth (Cuentas principales / Owner)
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: finalEmail,
          password: trimmedPassword,
        });

        if (data?.session && !authError) {
          const appMeta  = (data.user.app_metadata || {}) as Record<string, unknown>;
          const userMeta = (data.user.user_metadata || {}) as Record<string, unknown>;
          const role    = (appMeta.role as string) || (userMeta.role as string) || 'Owner';
          let tenants   = (appMeta.tenants as string[]) || (userMeta.tenants as string[]) || [];

          if (tenants.length === 0) {
            tenants = ['paradero', 'laslomas'];
          }

          onLoginSuccess({
            tenants,
            role,
            email: data.user.email ?? finalEmail,
            userId: data.user.id,
          });
          return;
        }
      } catch {
        // Continuar con verificación de PIN en base de datos
      }

      // 2. Buscar en la tabla 'users' de Supabase (Personal registrado en la web)
      try {
        const { data: dbUsers } = await supabase
          .from('users')
          .select('*')
          .or(`username.ilike.${trimmed},email.ilike.${trimmed},name.ilike.${trimmed}`);

        let matchedUser = dbUsers?.find(u => 
          (u.pin === trimmedPassword || u.pin === password) && u.active !== false
        );

        // 3. Si no respondió la red, buscar en el almacenamiento local de usuarios
        if (!matchedUser) {
          const localLomas = localStorage.getItem('laslomas_cafetin_users');
          const localParadero = localStorage.getItem('paradero_cafetin_users');
          const allLocal = [
            ...(localLomas ? JSON.parse(localLomas) : []),
            ...(localParadero ? JSON.parse(localParadero) : [])
          ];
          matchedUser = allLocal.find(u => 
            (u.username?.toLowerCase() === trimmed || u.email?.toLowerCase() === trimmed || u.name?.toLowerCase() === trimmed) &&
            (u.pin === trimmedPassword || u.pin === password) &&
            u.active !== false
          );
        }

        if (matchedUser) {
          const userTenant = matchedUser.tenant_id || 'laslomas';
          localStorage.setItem(`${userTenant}_active_user_id`, matchedUser.id);
          localStorage.setItem('cafetin_auth_user', JSON.stringify({
            tenants: [userTenant],
            role: matchedUser.role || 'Mozo',
            email: matchedUser.email || `${matchedUser.username}@cafetin.com`,
            userId: matchedUser.id,
          }));

          onLoginSuccess({
            tenants: [userTenant],
            role: matchedUser.role || 'Mozo',
            email: matchedUser.email || `${matchedUser.username}@cafetin.com`,
            userId: matchedUser.id,
          });
          return;
        }
      } catch (err) {
        console.warn('Error al verificar personal en BD:', err);
      }

      setError('Usuario o PIN incorrecto. Intenta de nuevo.');
      setLoading(false);
    } catch {
      setError('Error al iniciar sesión. Verifica tus datos.');
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setInfoMessage('Solicita asistencia al administrador del sistema.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans bg-[#e2e2e4] relative overflow-hidden">
      
      <div className="relative z-10 w-full max-w-[1050px] min-h-[640px] flex flex-col md:flex-row bg-[#131416] rounded-[2rem] shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden">
        


        {/* ── PANEL IZQUIERDO ── */}
        <div className="w-full md:w-1/2 relative flex flex-col items-center justify-end overflow-hidden min-h-[350px] md:min-h-full border-r border-stone-800/50">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-no-repeat transform scale-[1.02]"
            style={{ backgroundImage: 'url("/coffee-dark.png")', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
          <div className="relative z-10 w-[90%] max-w-sm mb-10 p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-5 shadow-2xl">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-[#d8a85c]">
              <BarChart2 strokeWidth={2.5} className="w-6 h-6" />
            </div>
            <p className="text-stone-300 text-[13px] leading-relaxed font-light pr-2">
              "Gestiona tu negocio con <span className="text-white font-medium">inteligencia</span>,
              crece con cada <span className="text-[#d8a85c] font-medium">decisión</span>."
            </p>
          </div>
        </div>

        {/* ── PANEL DERECHO ── */}
        <div className="w-full md:w-1/2 px-8 py-10 sm:px-14 sm:py-12 lg:px-16 lg:py-12 flex flex-col justify-center relative">
          
          <div className="w-full max-w-[400px] mx-auto">
            
            <div className="mb-8 flex items-center">
              <img 
                src="/logo-web.png" 
                alt="Logo Mi Cafetin" 
                className="w-16 h-16 object-contain drop-shadow-[0_2px_10px_rgba(196,154,69,0.3)] rounded-lg"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="ml-4">
                <span className="text-[#c49a45] text-[10px] font-bold tracking-[0.2em] uppercase">BIENVENIDO A</span>
                <h2 className="text-[#d8a85c] text-xl font-bold tracking-widest uppercase mt-0.5">MI CAFETIN</h2>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-[28px] font-bold text-white tracking-tight mb-2">
                Inicia sesión
              </h1>
              <p className="text-stone-400 text-[13px]">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c49a45] uppercase tracking-wider ml-1">
                  Usuario o Correo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <User className="h-[18px] w-[18px] text-stone-600" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="Ej: valentino, marcos1 o correo"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#fcfbf8] border border-[#fcfbf8] rounded-xl text-[14px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#d8a85c] transition-all [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#fcfbf8] [&:-webkit-autofill]:-webkit-text-fill-color-black"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c49a45] uppercase tracking-wider ml-1">
                  Contraseña o PIN (4 dígitos)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Lock className="h-[18px] w-[18px] text-stone-600" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="PIN (ej: 1234) o contraseña"
                    className="w-full pl-11 pr-12 py-3.5 bg-[#fcfbf8] border border-[#fcfbf8] rounded-xl text-[14px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#d8a85c] transition-all tracking-[0.2em] font-medium [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#fcfbf8] [&:-webkit-autofill]:-webkit-text-fill-color-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-500 hover:text-stone-800 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 border border-stone-500 rounded-[4px] peer-checked:bg-[#d8a85c] peer-checked:border-[#d8a85c] transition-all flex items-center justify-center group-hover:border-[#d8a85c]">
                      <svg className={`w-[10px] h-[10px] text-black font-bold transition-opacity ${rememberMe ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[13px] text-stone-300 font-medium select-none group-hover:text-white transition-colors">Recordarme</span>
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[12px] font-medium text-[#c49a45] hover:text-[#d8a85c] hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {infoMessage && (
                <div className="p-3 rounded-lg bg-[#d8a85c]/10 border border-[#d8a85c]/30 flex items-start gap-3 text-[#d8a85c] text-[12px] font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{infoMessage}</p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-[12px] font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden py-[14px] mt-2 bg-gradient-to-r from-[#b68c3c] via-[#d8a85c] to-[#b68c3c] text-black rounded-xl text-[15px] font-bold tracking-wide shadow-[0_0_20px_rgba(216,168,92,0.3)] hover:shadow-[0_0_25px_rgba(216,168,92,0.5)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span>Iniciar Sesión</span>
                  )}
                </div>
              </button>
            </form>
            
            <div className="mt-12">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-[1px] w-full bg-stone-800"></div>
                <span className="text-[9px] font-bold tracking-[0.2em] text-stone-500 uppercase whitespace-nowrap">ACCEDE AL SISTEMA</span>
                <div className="h-[1px] w-full bg-stone-800"></div>
              </div>
              
              <div className="flex justify-center gap-6">
                {[
                  { Icon: Coffee, label: 'CAFÉ' },
                  { Icon: Utensils, label: 'RESTÓ' },
                  { Icon: Calculator, label: 'POS' },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex flex-col items-center group cursor-default">
                    <div className="w-11 h-11 rounded-xl border border-stone-700/60 bg-[#1a1b1e] flex items-center justify-center mb-2 group-hover:border-[#c49a45]/50 group-hover:bg-[#1f2024] transition-all">
                      <Icon className="w-4 h-4 text-stone-400 group-hover:text-[#c49a45] transition-colors" strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] font-bold text-stone-300 tracking-wider leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
