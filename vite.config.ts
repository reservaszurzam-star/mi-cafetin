import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';

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
        const userToken = urlObj.searchParams.get('token') || '';
        const clean = rawNumber.replace(/\D/g, '').trim();

        res.setHeader('Content-Type', 'application/json');

        if (!clean) {
          res.end(JSON.stringify({ success: false, message: 'Documento vacío' }));
          return;
        }

        // Datos conocidos de la empresa
        if (clean === '10437453701' || clean === '43745370') {
          res.end(JSON.stringify({
            success: true,
            name: 'QUISPE FITZCARRALD JULIO ABEL',
            address: 'AV. LAS LOMAS 234 - LIMA'
          }));
          return;
        }

        // 1. Consulta RUC (11 dígitos)
        if (docType === 'RUC' && clean.length === 11) {
          // Intento con Token configurado
          if (userToken) {
            try {
              const apiRes = await fetch(`https://api.apis.net.pe/v2/sunat/ruc?numero=${clean}`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
              });
              if (apiRes.ok) {
                const data = await apiRes.json();
                const name = (data.razonSocial || data.nombre || '').trim();
                const address = (data.direccion || '').trim();
                if (name) {
                  res.end(JSON.stringify({ success: true, name, address: address || 'LIMA, PERÚ' }));
                  return;
                }
              }
            } catch {
              // Continuar
            }
          }

          // Intento 2: APIs públicas libres
          try {
            const apiRes = await fetch(`https://api.perudevs.com/api/v1/ruc?document=${clean}&key=cGVydWRldnMucHJveHkueHRydWN0dXJhLm1haW4=`, {
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (apiRes.ok) {
              const data = await apiRes.json();
              const resultData = data.resultado || data;
              const name = (resultData.razon_social || resultData.nombre_o_razon_social || resultData.nombre || '').trim();
              const address = (resultData.direccion || resultData.direccion_completa || '').trim();
              if (name) {
                res.end(JSON.stringify({ success: true, name, address: address || 'LIMA, PERÚ' }));
                return;
              }
            }
          } catch {
            // Continuar
          }

          // Intento 3: Si es RUC 10, consultar DNI embebido
          if (clean.startsWith('10')) {
            const embeddedDni = clean.substring(2, 10);
            try {
              const dniHeaders: Record<string, string> = { 'User-Agent': 'Mozilla/5.0' };
              if (userToken) dniHeaders['Authorization'] = `Bearer ${userToken}`;
              const dniRes = await fetch(`https://api.apis.net.pe/v2/reniec/dni?numero=${embeddedDni}`, {
                headers: dniHeaders
              });
              if (dniRes.ok) {
                const data = await dniRes.json();
                const name = (data.nombreCompleto || `${data.nombres || ''} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`).trim();
                if (name) {
                  res.end(JSON.stringify({ success: true, name, address: 'LIMA, PERÚ' }));
                  return;
                }
              }
            } catch {
              // Continuar
            }
          }
        }

        // 2. Consulta DNI (8 dígitos)
        if (docType === 'DNI' && clean.length === 8) {
          // Intento con Token configurado
          if (userToken) {
            try {
              const apiRes = await fetch(`https://api.apis.net.pe/v2/reniec/dni?numero=${clean}`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
              });
              if (apiRes.ok) {
                const data = await apiRes.json();
                const name = (data.nombreCompleto || `${data.nombres || ''} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`).trim();
                if (name) {
                  res.end(JSON.stringify({ success: true, name }));
                  return;
                }
              }
            } catch {
              // Continuar
            }
          }

          // Intento 2: apis.net.pe sin token
          try {
            const apiRes = await fetch(`https://api.apis.net.pe/v2/reniec/dni?numero=${clean}`, {
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (apiRes.ok) {
              const data = await apiRes.json();
              const name = (data.nombreCompleto || `${data.nombres || ''} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`).trim();
              if (name) {
                res.end(JSON.stringify({ success: true, name }));
                return;
              }
            }
          } catch {
            // Continuar
          }
        }

        res.end(JSON.stringify({ success: false, message: 'No se encontraron datos automáticos. Puedes escribir el nombre directamente.' }));
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
