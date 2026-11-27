import mongoose from "mongoose";

const { Schema } = mongoose;

// Claves de idempotencia (tabla idempotency_keys). El frontend manda una clave única (UUID) en la cabecera
// Idempotency-Key de las peticiones que no se pueden repetir (POST /api/cart/items suma cantidades).
// La primera vez se guarda la clave con la respuesta; si llega otra vez la misma clave (doble clic,
// reintento tras un corte de red...), se devuelve la respuesta guardada sin volver a ejecutar nada.
// Ver middleware/idempotency.js
const idempotencyKeySchema = new Schema(
  {
    key: { type: String, required: [true, "La clave es obligatoria"] },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: [true, "El usuario es obligatorio"] },
    method: { type: String, required: true }, // POST
    path: { type: String, required: true }, // /api/cart/items
    requestHash: { type: String, required: true }, // SHA-256 de método + ruta + body: la misma clave con otro body → 422
    // processing: la primera petición aún no ha terminado; completed: ya hay respuesta guardada
    status: { type: String, enum: ["processing", "completed"], default: "processing" },
    statusCode: { type: Number, default: null }, // código HTTP de la respuesta guardada (201, 200)
    response: { type: Schema.Types.Mixed, default: null }, // body JSON de la respuesta guardada
    expiresAt: { type: Date, required: true }, // MongoDB la borra sola al pasar esta fecha (índice TTL)
  },
  { timestamps: true, collection: "idempotency_keys" }
);

// Una clave por usuario: dos peticiones con la misma clave a la vez → el índice único rechaza la segunda
idempotencyKeySchema.index({ userId: 1, key: 1 }, { unique: true });
// TTL: las claves caducan (24 h) y MongoDB las borra solo
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("IdempotencyKey", idempotencyKeySchema);
