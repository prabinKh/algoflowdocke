import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import { startDjango } from "./run_backend.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  console.log(`[${new Date().toISOString()}] Starting server on port ${PORT}...`);

  // Start Django backend
  try {
    startDjango();
  } catch (err) {
    console.error("Failed to trigger startDjango:", err);
  }

  app.use(cors());

  // Leave proxied API requests unparsed so http-proxy-middleware can forward
  // the raw JSON body to Django intact. Parsing the body in Express first
  // causes DRF to receive an empty or malformed payload on login requests.

  // Health check - handle before proxy
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
  });

  // Proxy API and Admin requests to Django
  app.use(
    ["/api", "/django-admin", "/static", "/media"],
    createProxyMiddleware({
      target: "http://127.0.0.1:8001",
      // IMPORTANT: changeOrigin is OFF on purpose. With changeOrigin:true,
      // http-proxy-middleware rewrites the outgoing Host header to match
      // the target (127.0.0.1:8001), which destroys the original
      // hostname the browser sent (e.g. "aalu.localhost:3000"). Django's
      // multi-tenant resolution (Company.resolve_from_request, see
      // backend/company/models.py) reads that Host header to figure out
      // which company's subdomain the request came from. Losing it
      // silently breaks tenant detection and falls back to "first
      // company in the DB" for unauthenticated requests - a real
      // cross-tenant data leak, not just a cosmetic bug.
      changeOrigin: false,
      pathFilter: (reqPath) => reqPath !== "/api/health",
      pathRewrite: (path, req) => {
        // Express strips the mounted prefix from req.url when using
        // app.use(['/api', ...], middleware). Preserve the original
        // incoming path so Django receives the same route the browser
        // requested.
        return req.originalUrl || path;
      },
      on: {
        proxyReq: (proxyReq, req) => {
          // Belt-and-suspenders: explicitly forward the original Host
          // too, in case any upstream code prefers X-Forwarded-Host.
          const originalHost = req.headers.host;
          if (originalHost) {
            proxyReq.setHeader("X-Forwarded-Host", originalHost);
          }
        },
        error: (err, req, res) => {
          console.error(`Proxy Error for ${req.url}:`, err.message);
          if (!res.headersSent) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Backend not ready.", details: err.message }));
          }
        }
      }
    })
  );

  if (process.env.NODE_ENV !== "production") {
    // Dynamically import Vite only when in development mode
    const { createServer: createViteServer } = await import("vite");
    
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      
      // FIX: Express 5.0 compatible wildcard using a RegExp literal to match any path
      app.get(/.*/, (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn("Warning: 'dist' folder not found. Static files will not be served.");
      // FIX: Express 5.0 compatible fallback using RegExp
      app.get(/.*/, (req, res) => {
        res.status(404).send("Production build not found. Please run 'npm run build'.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    // NOTE: we still BIND to 0.0.0.0 (correct - means "listen on every
    // network interface", required for Docker/external access). But we
    // LOG a real, clickable URL instead, since "http://0.0.0.0:PORT" is
    // not a valid address to visit in a browser.
    console.log(`[${new Date().toISOString()}] Server running -> http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server startup error:", err);
  process.exit(1);
});