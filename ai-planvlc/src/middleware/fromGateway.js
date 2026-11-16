import crypto from "node:crypto";
import AppError from "../services/utils/AppError.js";

// Solo deja pasar las peticiones que vienen de la API Gateway: la gateway añade la cabecera
// x-gateway-key con la clave compartida (GATEWAY_SECRET). Si alguien llama al servicio directamente, 403
const fromGateway = (req, _res, next) => {
  const expected = Buffer.from(process.env.GATEWAY_SECRET ?? "");
  const received = Buffer.from(req.get("x-gateway-key") ?? "");
  // timingSafeEqual: compara sin dar pistas por el tiempo que tarda (necesita la misma longitud)
  const valid = expected.length > 0 && received.length === expected.length
    && crypto.timingSafeEqual(received, expected);
  if (!valid) return next(new AppError("Acceso no permitido", 403));
  next();
};

export default fromGateway;
