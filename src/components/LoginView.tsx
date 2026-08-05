import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Coffee } from 'lucide-react';
import { useAppStore } from '../hooks/StoreContext';

export default function LoginView({ onLogin }: { onLogin: () => void }) {
  const { settings } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      onLogin();
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/20 dark:bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl rounded-[2.5rem] p-10 w-full max-w-md border border-stone-200/80 dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-amber-50 dark:bg-amber-900/10 p-2 rounded-full mb-5 shadow-lg shadow-amber-500/20 border-2 border-amber-500/20">
            <img src="/logo.jpg" alt="Logo" className="w-28 h-28 object-contain rounded-full bg-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-stone-900 dark:text-white mb-2 font-display">MI CAFETIN</h1>
          <p className="text-stone-500 dark:text-stone-400 font-medium">Bienvenido de nuevo</p>
          <div className="mt-3 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px] font-mono text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
            Credenciales: <strong className="text-amber-700 dark:text-amber-400">admin</strong> / <strong className="text-amber-700 dark:text-amber-400">admin123</strong>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Usuario</label>
              <Input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-stone-50 dark:bg-stone-900/50 border-stone-200/80 dark:border-stone-800/80 rounded-xl px-4 py-3 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Contraseña</label>
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-stone-50 dark:bg-stone-900/50 border-stone-200/80 dark:border-stone-800/80 rounded-xl px-4 py-3 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50">
              <p className="text-rose-600 dark:text-rose-400 text-sm font-medium text-center">{error}</p>
            </div>
          )}
          <Button type="submit" className="w-full h-12 text-lg bg-[#4A3728] hover:bg-[#3A2A1E] text-white dark:bg-[#E8DCC4] dark:hover:bg-white dark:text-[#4A3728] rounded-xl shadow-lg shadow-stone-900/10 dark:shadow-none transition-all font-semibold tracking-wide mt-2">
            Iniciar Sesión
          </Button>
        </form>
      </div>
    </div>
  );
}
