import React, { useState } from 'react';
import { 
  Database, RefreshCw, ShieldCheck, AlertCircle, 
  CheckCircle2, Sparkles, Copy, Check 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { SupabaseSyncConfig } from '../../types';
import { SUPABASE_SCHEMA_SQL } from '../../lib/supabase';

interface SupabaseSyncTabProps {
  supabaseConfig: SupabaseSyncConfig;
  onUpdateConfig: (config: SupabaseSyncConfig) => void;
  onTestConnection: () => Promise<void>;
  onSyncAll: () => Promise<void>;
  isTesting: boolean;
  isSyncing: boolean;
  testResult: { success?: boolean; message?: string } | null;
  syncStatusMsg: string;
}

export const SupabaseSyncTab: React.FC<SupabaseSyncTabProps> = ({
  supabaseConfig,
  onUpdateConfig,
  onTestConnection,
  onSyncAll,
  isTesting,
  isSyncing,
  testResult,
  syncStatusMsg,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black">
            <Database className="w-7 h-7 text-emerald-300" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">Base de Datos & Tiempo Real</span>
            <h3 className="font-black text-xl">Conexión Supabase (Postgres & Auth)</h3>
            <p className="text-xs text-emerald-100 mt-0.5">Sincroniza repartidores, usuarios y telemetría de tracking en vivo con tu proyecto Supabase</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSyncAll}
            disabled={isSyncing}
            className="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg transition disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Todo Ahora'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de Credenciales */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <h4 className="font-black text-base text-stone-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            Credenciales del Proyecto Supabase
          </h4>
          <p className="text-xs text-stone-500 font-medium">
            Ingresa las credenciales de tu proyecto en Supabase Dashboard → Settings → API:
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Project URL (VITE_SUPABASE_URL)</label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseConfig.url}
                onChange={(e) => onUpdateConfig({ ...supabaseConfig, url: e.target.value.trim() })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-mono text-stone-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Anon Public Key (VITE_SUPABASE_ANON_KEY)</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseConfig.anonKey}
                onChange={(e) => onUpdateConfig({ ...supabaseConfig, anonKey: e.target.value.trim() })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-mono text-stone-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onTestConnection}
                disabled={isTesting}
                className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                <span>Probar y Guardar Conexión</span>
              </button>
            </div>

            {testResult && (
              <div className={cn(
                "p-3 rounded-xl border text-xs font-bold flex items-start gap-2",
                testResult.success ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
              )}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}

            {syncStatusMsg && (
              <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold">
                {syncStatusMsg}
              </div>
            )}
          </div>
        </div>

        {/* Script SQL de Migración */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-black text-base text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Script SQL para Supabase Editor
              </h4>
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Copia y pega este script en tu Supabase SQL Editor para crear las tablas con soporte de usuarios, tracking GPS y Realtime:
            </p>

            <div className="mt-3 bg-stone-900 text-stone-200 p-3.5 rounded-2xl font-mono text-[11px] max-h-56 overflow-y-auto custom-scrollbar border border-stone-800">
              <pre className="whitespace-pre-wrap">{SUPABASE_SCHEMA_SQL.slice(0, 800)}...</pre>
            </div>
          </div>

          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1 font-medium">
            <span className="font-bold text-stone-900 block">Tablas creadas por el script:</span>
            <p>• <strong>profiles</strong>: Usuarios sincronizados con auth.users</p>
            <p>• <strong>delivery_drivers</strong>: Motorizados vinculados a perfiles</p>
            <p>• <strong>orders & delivery_tracking</strong>: Comandas y telemetría GPS en tiempo real</p>
          </div>
        </div>
      </div>
    </div>
  );
};
