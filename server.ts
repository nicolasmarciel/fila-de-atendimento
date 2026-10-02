import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const FLASK_PORT = 5001;

app.use(express.json());

// Spawn Python Flask + SQLite backend process
console.log('🐍 Iniciando backend Python Flask + SQLite...');
const pythonProcess = spawn('python3', ['app.py'], {
  cwd: __dirname,
  env: { ...process.env, PORT: String(FLASK_PORT) },
  stdio: 'inherit',
});

pythonProcess.on('error', (err) => {
  console.error('Falha ao iniciar processo Python:', err);
});

process.on('exit', () => {
  pythonProcess.kill();
});

// Proxy /api requests to the Python Flask backend
app.use('/api', async (req, res) => {
  const targetUrl = `http://127.0.0.1:${FLASK_PORT}/api${req.url}`;
  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    // Handle CSV attachment downloads
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      res.setHeader('content-disposition', contentDisposition);
    }

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.setHeader('content-type', contentType);
      return res.status(response.status).send(text);
    }
  } catch (error) {
    console.error(`Erro ao comunicar com Flask na rota ${req.url}:`, error);
    res.status(502).json({
      error: 'Backend Python Flask inicializando ou indisponível',
      details: String(error),
    });
  }
});

// Mount Vite middleware in development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ FilaExpress rodando com sucesso em http://0.0.0.0:${PORT}`);
    console.log(`⚡ Backend: Python 3 + Flask + SQLite (fila.db) na porta ${FLASK_PORT}`);
  });
}

startServer();
