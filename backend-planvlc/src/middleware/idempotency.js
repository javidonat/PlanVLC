import crypto from "node:crypto";
import idempotencyRepo from "../repos/idempotency.repo.js";
import AppError from "../services/utils/AppError.js";

// Idempotencia: repetir la misma petición (misma cabecera Idempotency-Key) no la ejecuta dos veces.
// Va después de authenticate (las claves son de cada usuario) y de validate (se compara el body ya limpio):
//
//   router.post("/items", validate({ body: addCartItemSchema }), idempotency, cartCtrl.postItem);
//
// 1. Primera vez: se guarda la clave como "processing" y sigue al controlador. Cuando responde:
//    - 2xx → se guarda la respuesta (status "completed")
//    - error → se borra la clave, así se puede reintentar con la misma (p. ej. tras liberar plazas)
// 2. Clave repetida (el índice único userId + key salta con el error 11000):
//    - con otro body o en otra ruta → 422 (la clave es de otra petición)
//    - la primera aún no ha terminado → 409
//    - ya terminada → se devuelve la respuesta guardada, con la cabecera Idempotent-Replayed: true
const TTL_MS = 24 * 60 * 60 * 1000; // las claves valen 24 h
const KEY_PATTERN = /^[A-Za-z0-9_-]{8,100}$/; // un UUID cumple

const hashRequest = (req) =>
  crypto.createHash("sha256").update(`${req.method} ${req.baseUrl}${req.path} ${JSON.stringify(req.body ?? {})}`).digest("hex");

const idempotency = async (req, res, next) => {
  try {
    const key = req.get("Idempotency-Key");
    if (!key) throw new AppError("Falta la cabecera Idempotency-Key", 400);
    if (!KEY_PATTERN.test(key)) throw new AppError("La cabecera Idempotency-Key no es válida (8-100 letras, números, - o _)", 400);

    const requestHash = hashRequest(req);
    let record;
    try {
      record = await idempotencyRepo.create({
        key,
        userId: req.user.id,
        method: req.method,
        path: `${req.baseUrl}${req.path}`,
        requestHash,
        expiresAt: new Date(Date.now() + TTL_MS),
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      // Ya existe: es una repetición
      const previous = await idempotencyRepo.findByUserAndKey(req.user.id, key);
      if (!previous) throw new AppError("La petición anterior acaba de fallar. Vuelve a intentarlo", 409);
      if (previous.requestHash !== requestHash) throw new AppError("Esta Idempotency-Key ya se usó con otra petición", 422);
      if (previous.status === "processing") throw new AppError("Esta petición ya se está procesando", 409);
      res.set("Idempotent-Replayed", "true");
      return res.status(previous.statusCode).json(previous.response);
    }

    // Se intercepta res.json (lo usan el controlador y el middleware de errores) para guardar
    // el resultado ANTES de enviar la respuesta: así una repetición nunca lo encuentra a medias
    const sendJson = res.json.bind(res);
    res.json = (body) => {
      const save = res.statusCode < 400
        ? idempotencyRepo.complete(record._id, res.statusCode, body)
        : idempotencyRepo.remove(record._id);
      save
        .catch((error) => console.error("No se pudo guardar la clave de idempotencia:", error))
        .finally(() => sendJson(body));
      return res;
    };
    next();
  } catch (error) {
    next(error);
  }
};

export default idempotency;
