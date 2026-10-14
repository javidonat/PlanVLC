import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler.js";
import AppError from "./services/utils/AppError.js";
import plansRoutes from "./routes/plans.routes.js";

const app = express();

// --- Middlewares globales ---
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors());              // Permite peticiones desde otros orígenes
app.use(express.json());      // Parsea el body de las peticiones a JSON

// --- Health check (para comprobar que el servidor está vivo) ---
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// --- Rutas ---
app.use("/api/plans", plansRoutes);

// --- Ruta no encontrada (404) ---
app.use((req, _res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
});

// --- Middleware de errores (siempre al final) ---
app.use(errorHandler);

export default app;
