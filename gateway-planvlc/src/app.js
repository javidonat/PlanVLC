import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";

// API Gateway: el frontend solo conoce esta dirección (localhost:4000).
// Detrás quedan el backend (3000, con la base de datos) y el servicio de IA (3001, sin base de datos).
// Así la IA y el backend están separados: si alguien abusa del chatbot, no llega al backend.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:3001";

const app = express();
app.locals.backendUrl = BACKEND_URL;
app.locals.aiServiceUrl = AI_SERVICE_URL;

// --- Middlewares globales ---
// Ojo: aquí NO va express.json(): leería el cuerpo y el proxy lo reenviaría vacío
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
// credentials: deja que el navegador mande y reciba las cookies de la sesión (access_token y refresh_token)
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:4200", credentials: true }));

// --- Health check ---
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Si el servicio de destino está apagado, error claro en el mismo formato que el backend
const onProxyError = (_err, _req, res) => {
  if (res.headersSent) return res.end();
  res.status(502).json({ ok: false, message: "El servicio no está disponible. Inténtalo más tarde" });
};

// El CORS lo decide la gateway: se quitan las cabeceras CORS que mande el servicio de detrás
// (el backend tiene cors() abierto y, si no, pisaría la restricción de arriba)
const onProxyRes = (proxyRes) => {
  for (const header of Object.keys(proxyRes.headers)) {
    if (header.startsWith("access-control-")) delete proxyRes.headers[header];
  }
};

// --- Servicio de IA: /api/ai/* ---
// Límite de peticiones por IP: cada una gasta peticiones de OpenRouter. Chatbot: 20 preguntas cada 10 minutos
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { ok: false, message: "Has hecho muchas preguntas seguidas. Espera unos minutos y vuelve a probar" },
});

// Análisis de opiniones: se pide al abrir el detalle de un plan, así que permite más.
// Además, el servicio de IA guarda los análisis en caché y los repetidos no llegan al modelo
const reviewsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { ok: false, message: "Demasiadas peticiones al asistente. Espera unos minutos y vuelve a probar" },
});

app.use("/api/ai/plan-chat", aiLimiter);
app.use("/api/ai/reviews-analysis", reviewsLimiter);
// pathFilter (en vez de app.use("/api/ai", proxy)): así no se recorta la ruta al reenviarla
app.use(createProxyMiddleware({
  pathFilter: "/api/ai",
  target: AI_SERVICE_URL,
  changeOrigin: true,
  // La gateway firma la petición: el servicio de IA rechaza todo lo que no traiga esta cabecera
  headers: { "x-gateway-key": process.env.GATEWAY_SECRET ?? "" },
  on: { proxyRes: onProxyRes, error: onProxyError },
}));

// --- Backend: el resto de /api/* ---
app.use(createProxyMiddleware({
  pathFilter: "/api",
  target: BACKEND_URL,
  changeOrigin: true,
  on: { proxyRes: onProxyRes, error: onProxyError },
}));

// --- Ruta no encontrada (404) ---
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

export default app;
