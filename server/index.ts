import express from 'express';
import cors from 'cors';
import { handlePrinterApiRequest } from './api/printerRouter';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Middleware para pasar todas las peticiones /api a nuestro router
app.use('/api', async (req, res, next) => {
  const handled = await handlePrinterApiRequest(req, res);
  if (!handled) {
    next();
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Mi Cafetín Print Service', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[PrintService] Servidor de impresión Node.js escuchando en http://localhost:${PORT}`);
  });
}

export default app;
