// Middleware que captura todos los errores y devuelve una respuesta JSON limpia

// Convierte los errores de Mongoose y de Express en errores HTTP con un mensaje legible.
// Devuelve null si el error no es de ese tipo.
const translateError = (err) => {
  // Errores de validación del modelo (campo obligatorio, estado no válido, precio negativo...)
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) =>
      e.name === "CastError" ? `El campo "${e.path}" no tiene un formato válido` : e.message
    );
    return { statusCode: 400, message: messages.join(". ") };
  }

  // Un valor con tipo incorrecto (por ejemplo, minAge: "abc")
  if (err.name === "CastError") {
    return { statusCode: 400, message: `El campo "${err.path}" no tiene un formato válido` };
  }

  // El body de la petición no es un JSON válido
  if (err.type === "entity.parse.failed") {
    return { statusCode: 400, message: "El body de la petición no es un JSON válido" };
  }

  // Índice único de MongoDB violado (p. ej. dos peticiones simultáneas generan el mismo slug)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "valor";
    return { statusCode: 409, message: `Ya existe un registro con ese ${field}. Inténtalo de nuevo` };
  }

  return null;
};

const errorHandler = (err, req, res, next) => {
  // Si ya se empezó a enviar la respuesta, Express debe cerrarla él mismo
  if (res.headersSent) return next(err);

  const translated = translateError(err);

  const statusCode = translated?.statusCode || err.statusCode || 500;
  let message = translated?.message || err.message || "Error interno del servidor";

  // Los errores 500 que no son AppError son bugs: se registran y, en producción,
  // no se enseña su mensaje interno al cliente
  if (statusCode >= 500) {
    console.error(err);
    if (!err.isOperational && process.env.NODE_ENV === "production") {
      message = "Error interno del servidor";
    }
  }

  const response = { ok: false, status: statusCode, message };
  // Detalle por campo (validación). Solo en AppError: los errores de Mongoose también tienen
  // `errors`, pero es un objeto interno que no debe llegar al cliente
  if (err.isOperational && err.errors) response.errors = err.errors;

  res.status(statusCode).json(response);
};

export default errorHandler;
