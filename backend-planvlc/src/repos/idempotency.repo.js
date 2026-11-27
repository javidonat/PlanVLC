import { IdempotencyKey } from "../models/index.js";

// Consultas de las claves de idempotencia (tabla idempotency_keys)

// Guarda la clave como "processing". Si ya existe (mismo usuario y clave) MongoDB lanza el error 11000
const create = (data) => IdempotencyKey.create(data);

const findByUserAndKey = (userId, key) => IdempotencyKey.findOne({ userId, key }).lean();

// La petición ha ido bien: se guarda la respuesta para devolverla si se repite
const complete = (id, statusCode, response) =>
  IdempotencyKey.updateOne({ _id: id }, { $set: { status: "completed", statusCode, response } });

// La petición ha fallado: se borra la clave para que se pueda reintentar con ella
const remove = (id) => IdempotencyKey.deleteOne({ _id: id });

export default { create, findByUserAndKey, complete, remove };
