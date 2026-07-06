import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Critical Environment Variable Assertions
const requiredEnv = ['MONGO_URI', 'ACCESS_TOKEN_SECRET'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`CRITICAL CONFIG ERROR: Environment variable "${key}" is missing!`);
    process.exit(1);
  }
}

// Import app after environment variables are loaded
import app from './src/server/app.js';

async function startServer() {
  const PORT = process.env.PORT || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
