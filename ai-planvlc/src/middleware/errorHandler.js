// Middleware que captura todos los errores y devuelve una respuesta JSON limpia
const errorHandler = (err, req, res, next) => {
  // Si ya se empezó a enviar la respuesta, Express debe cerrarla él mismo
  if (res.headersSent) return next(err);

  // El body de la petición no es un JSON válido o es demasiado grande
  if (err.type === "entity.parse.failed") err = { statusCode: 400, message: "El body de la petición no es un JSON válido", isOperational: true };
  if (err.type === "entity.too.large") err = { statusCode: 413, message: "La petición es demasiado grande", isOperational: true };

  const statusCode = err.statusCode || 500;
  let message = err.message || "Error interno del servidor";

  // Los errores 500 que no son AppError son bugs: se registran y no se enseña su mensaje interno
  if (statusCode >= 500) {
    console.error(err);
    if (!err.isOperational) message = "Error interno del servidor";
  }

  const response = { ok: false, status: statusCode, message };
  if (err.isOperational && err.errors) response.errors = err.errors;
  res.status(statusCode).json(response);
};

export default errorHandler;
