import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import LoginView from './features/auth/LoginView';
import BusinessSelectorView from './features/auth/BusinessSelectorView';
import PublicMenuView from './features/public/PublicMenuView';
import './index.css';
import { StoreProvider } from './hooks/StoreContext';
import { supabase } from './lib/supabaseClient';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'select_tenant'; tenants: string[]; role: string; email: string; userId: string }
  | { status: 'ready';         tenantId: string;  role: string; email: string; userId: string };

// ─── Root ─────────────────────────────────────────────────────────────────────

function Root() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });
  const path = window.location.pathname;

  // Rutas públicas: solo /carta/* muestra la carta al cliente sin login
  const isPublicMenu = path.startsWith('/carta');

  if (isPublicMenu) {
    // Extraer tenantId: /carta/paradero → 'paradero', /carta/laslomas → 'laslomas'
    const parts = path.split('/');
    const tenantId = parts[2] || 'paradero';

    return (
      <StoreProvider tenantId={tenantId} key={`public-${tenantId}`}>
        <PublicMenuView />
      </StoreProvider>
    );
  }

  // ─── Flujo de Autenticación para Administradores (/admin) ───
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Sin sesión guardada → pantalla de login
        setAuth({ status: 'unauthenticated' });
        return;
      }

      restoreSession(session.user);
    };

    init();

    // Escuchar cambios de sesión (logout externo, token expirado, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuth({ status: 'unauthenticated' });
        localStorage.removeItem('cafetin_tenantId');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Restaura la sesión ya autenticada
  const restoreSession = (user: { id: string; email?: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) => {
    const appMeta  = (user.app_metadata || {}) as Record<string, unknown>;
    const userMeta = (user.user_metadata || {}) as Record<string, unknown>;
    
    const role    = (appMeta.role as string) || (userMeta.role as string) || 'Owner';
    let tenants   = (appMeta.tenants as string[]) || (userMeta.tenants as string[]) || [];
    const email   = user.email ?? '';

    if (tenants.length === 0) {
      tenants = ['paradero', 'laslomas'];
    }

    // Si solo tiene una sede asignada → ir directamente (no mostrar selector)
    const savedTenant = localStorage.getItem('cafetin_tenantId');
    if (tenants.length === 1) {
      const tenantId = tenants[0];
      localStorage.setItem('cafetin_tenantId', tenantId);
      setAuth({ status: 'ready', tenantId, role, email, userId: user.id });
    } else if (savedTenant && tenants.includes(savedTenant)) {
      // Tenía una sede guardada y sigue teniendo acceso → restaurar
      setAuth({ status: 'ready', tenantId: savedTenant, role, email, userId: user.id });
    } else {
      // Tiene múltiples sedes (ej. Owner o Administrador multi-sede) → mostrar selector
      setAuth({ status: 'select_tenant', tenants, role, email, userId: user.id });
    }
  };

  // Callback del LoginView cuando Supabase Auth confirma la sesión
  const handleLoginSuccess = (result: { tenants: string[]; role: string; email: string; userId: string }) => {
    if (result.tenants.length === 1) {
      const tenantId = result.tenants[0];
      localStorage.setItem('cafetin_tenantId', tenantId);
      setAuth({ status: 'ready', tenantId, role: result.role, email: result.email, userId: result.userId });
    } else {
      // Multi-sede (Owner u Administrador de ambas sedes) → mostrar selector
      setAuth({ status: 'select_tenant', ...result });
    }
  };

  // Callback cuando el usuario elige una sede en el selector
  const handleSelectTenant = (tenantId: string) => {
    if (auth.status !== 'select_tenant') return;
    localStorage.setItem('cafetin_tenantId', tenantId);
    setAuth({
      status:   'ready',
      tenantId,
      role:     auth.role,
      email:    auth.email,
      userId:   auth.userId,
    });
  };

  // Volver al selector de negocio (sin perder la sesión)
  const handleBackToBrands = () => {
    if (auth.status !== 'ready') return;
    localStorage.removeItem('cafetin_tenantId');
    setAuth({
      status:  'select_tenant',
      tenants: [], // se rellenará al volver al selector — el Owner siempre tiene ambas
      role:    auth.role,
      email:   auth.email,
      userId:  auth.userId,
    });
    // Releer tenants del JWT actual
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const meta = data.user.app_metadata as Record<string, unknown>;
      const tenants = (meta.tenants as string[]) || [];
      setAuth(prev => prev.status === 'select_tenant' ? { ...prev, tenants } : prev);
    });
  };

  // Logout completo
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('cafetin_tenantId');
    setAuth({ status: 'unauthenticated' });
  };

  // ── Render según estado ──────────────────────────────────────────────────────

  // Cargando sesión inicial
  if (auth.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0C0C]">
        <img src="/LOGO OFICIAL.png" alt="STC" className="w-40 opacity-80 animate-pulse" />
      </div>
    );
  }

  // Sin sesión → Login
  if (auth.status === 'unauthenticated') {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Con sesión pero necesita elegir negocio
  if (auth.status === 'select_tenant') {
    return (
      <BusinessSelectorView
        onSelectTenant={handleSelectTenant}
        allowedTenants={auth.tenants}
        userRole={auth.role}
        onLogout={handleLogout}
      />
    );
  }

  // Listo → cargar App con el tenant seleccionado
  return (
    <StoreProvider tenantId={auth.tenantId} key={auth.tenantId}>
      <App
        onBackToBrands={handleBackToBrands}
        onLogout={handleLogout}
        tenantId={auth.tenantId}
      />
    </StoreProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
