import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';

const OFFICIAL_LOOKUP_TOKEN = 'sk_18750.Kz5Db2bkVuxXsVXdz5yXs5rugHLpQTIf';

function docLookupPlugin(): Plugin {
  return {
    name: 'doc-lookup-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/consult-doc')) {
          return next();
        }

        const urlObj = new URL(req.url, 'http://localhost:3000');
        const docType = urlObj.searchParams.get('type') || 'DNI';
        const rawNumber = urlObj.searchParams.get('number') || '';
        const userToken = urlObj.searchParams.get('token') || OFFICIAL_LOOKUP_TOKEN;
        const clean = rawNumber.replace(/\D/g, '').trim();

        res.setHeader('Content-Type', 'application/json');

        if (!clean) {
          res.end(JSON.stringify({ success: false, message: 'Documento vacío' }));
          return;
        }

        // Datos conocidos del emisor
        if (clean === '10437453701' || clean === '43745370') {
          res.end(JSON.stringify({
            success: true,
            name: 'QUISPE FITZCARRALD JULIO ABEL',
            address: 'AV. LAS LOMAS 234 - LIMA'
          }));
          return;
        }

        // 1. Consulta RUC (11 dígitos) en Decolecta / SUNAT Oficial
        if (docType === 'RUC' && clean.length === 11) {
          try {
            const apiRes = await fetch(`https://api.decolecta.com/v1/sunat/ruc?numero=${clean}`, {
              headers: { 
                'Authorization': `Bearer ${userToken}`,
                'User-Agent': 'Mozilla/5.0'
              }
            });
            if (apiRes.ok) {
              const data = await apiRes.json();
              const name = (data.razon_social || data.nombre_o_razon_social || data.nombre || '').trim();
              const direccion = data.direccion && data.direccion !== '-' ? data.direccion : 
                [data.departamento, data.provincia, data.distrito].filter(Boolean).join(', ') || 'LIMA, PERÚ';
              
              if (name) {
                res.end(JSON.stringify({ 
                  success: true, 
                  name, 
                  address: direccion,
                  estado: data.estado || 'ACTIVO',
                  condicion: data.condicion || 'HABIDO'
                }));
                return;
              }
            }
          } catch (e) {
            console.error('Error Decolecta RUC:', e);
          }

          // Fallback Si es RUC 10, consultar DNI
          if (clean.startsWith('10')) {
            const embeddedDni = clean.substring(2, 10);
            try {
              const dniRes = await fetch(`https://api.decolecta.com/v1/reniec/dni?numero=${embeddedDni}`, {
                headers: { 
                  'Authorization': `Bearer ${userToken}`,
                  'User-Agent': 'Mozilla/5.0'
                }
              });
              if (dniRes.ok) {
                const data = await dniRes.json();
                const name = (data.full_name || `${data.first_name || ''} ${data.first_last_name || ''} ${data.second_last_name || ''}`).trim();
                if (name) {
                  res.end(JSON.stringify({ success: true, name, address: 'LIMA, PERÚ' }));
                  return;
                }
              }
            } catch (e) {
              // Continuar
            }
          }
        }

        // 2. Consulta DNI (8 dígitos) en Decolecta / RENIEC Oficial
        if (docType === 'DNI' && clean.length === 8) {
          try {
            const apiRes = await fetch(`https://api.decolecta.com/v1/reniec/dni?numero=${clean}`, {
              headers: { 
                'Authorization': `Bearer ${userToken}`,
                'User-Agent': 'Mozilla/5.0'
              }
            });
            if (apiRes.ok) {
              const data = await apiRes.json();
              const name = (data.full_name || `${data.first_name || ''} ${data.first_last_name || ''} ${data.second_last_name || ''}`).trim();
              if (name) {
                res.end(JSON.stringify({ success: true, name }));
                return;
              }
            }
          } catch (e) {
            console.error('Error Decolecta DNI:', e);
          }
        }

        res.end(JSON.stringify({ success: false, message: 'Documento no encontrado' }));
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), docLookupPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: ['**/public/**']
      }
    },
  };
});
