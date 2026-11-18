import mongoose from "mongoose";

const { Schema } = mongoose;

// Refresh tokens (sesiones abiertas). El token va en la cookie refresh_token y aquí solo se guarda
// su hash (SHA-256): si alguien lee la base de datos, no puede usarlo. Colección "refreshtokens"
const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: [true, "El hash del token es obligatorio"], unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: [true, "El usuario es obligatorio"], index: true },
    // Cuándo caduca. Índice TTL: MongoDB borra el documento solo al llegar esa fecha
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    // Se rellena al usarlo en /refresh (se cambia por uno nuevo) o al hacer logout. Revocado = ya no vale
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("RefreshToken", refreshTokenSchema);
