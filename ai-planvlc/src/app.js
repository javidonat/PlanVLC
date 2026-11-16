import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import fromGateway from "./middleware/fromGateway.js";
import errorHandler from "./middleware/errorHandler.js";
import AppError from "./services/utils/AppError.js";
import chatRoutes from "./routes/chat.routes.js";

// Servicio de IA: separado del backend y SIN acceso a la base de datos.
// Recibe los datos del plan en la petición y se los pasa al modelo de OpenRouter
const app = express();

// --- Middlewares globales ---
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "50kb" })); // la petición lleva el plan y unos pocos mensajes: no hace falta más

// --- Health check ---
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// --- Rutas (solo a través de la gateway) ---
app.use("/api/ai", fromGateway, chatRoutes);

// --- Ruta no encontrada (404) ---
app.use((req, _res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
});

// --- Middleware de errores (siempre al final) ---
app.use(errorHandler);

export default app;
