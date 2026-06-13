import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import { startDjango } from "./run_backend.ts";

dotenv.config();

// We rely entirely on process.cwd() to avoid import.meta issues in bundles

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Start Django backend
  startDjango();

  // Log all requests to a file for debugging
  const logStream = fs.createWriteStream(path.join(process.cwd(), 'server.log'), { flags: 'a' });
  logStream.on('error', (err) => {
    console.error("logStream error (safely handled):", err);
  });

  const safeLogWrite = (msg: string) => {
    if (logStream && !logStream.destroyed && logStream.writable) {
      try {
        logStream.write(msg);
      } catch (err) {
        console.error("safeLogWrite failed:", err);
      }
    }
  };

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const log = `${new Date().toISOString()} - ${req.method} ${req.url} [${res.statusCode}] ${duration}ms\n`;
      process.stdout.write(log);
      safeLogWrite(log);
    });
    next();
  });

  // Health check - handle before proxy
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Proxy API and Admin requests to Django
  app.use(
    createProxyMiddleware({
      target: "http://127.0.0.1:8001",
      changeOrigin: true,
      pathFilter: (reqPath) => (reqPath.startsWith("/api") && reqPath !== "/api/health") || reqPath.startsWith("/django-admin") || reqPath.startsWith("/static") || reqPath.startsWith("/media"),
      proxyTimeout: 30000,
      timeout: 30000,
      on: {
        proxyReq: (proxyReq, req, res) => {
          const clientHost = req.headers.host;
          if (clientHost) {
            proxyReq.setHeader('X-Forwarded-Host', clientHost);
          }
          const log = `Proxying ${req.method} ${req.url} -> http://localhost:8001${req.url}\n`;
          process.stdout.write(log);
          safeLogWrite(log);
        },
        error: (err, req, res) => {
          console.error(`Proxy Error for ${req.url}:`, err);
          if (!res.headersSent) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Backend not ready or timed out.", details: err.message }));
          }
        }
      }
    })
  );

  app.use(cors());
  app.use(express.json());

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files and fallback to index.html
    const distPath = path.join(process.cwd(), 'dist');
    
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
    }));
    
    // FIX: Express 5 / path-to-regexp v8 requires named wildcards like {*splat}
    app.get('/{*splat}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();