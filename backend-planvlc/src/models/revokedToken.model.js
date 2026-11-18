import mongoose from "mongoose";

const { Schema } = mongoose;

// Access tokens revocados (logout). El JWT sigue siendo válido hasta que caduca, así que al hacer
// logout se guarda aquí su hash (SHA-256) y el middleware de autenticación ya no lo acepta.
// Colección "revokedtokens"
const revokedTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: [true, "El hash del token es obligatorio"], unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: [true, "El usuario es obligatorio"] },
    // Cuándo caduca el token. Índice TTL: MongoDB borra el documento solo al llegar esa fecha,
    // porque a partir de ahí el token ya no vale de todas formas
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default mongoose.model("RevokedToken", revokedTokenSchema);
