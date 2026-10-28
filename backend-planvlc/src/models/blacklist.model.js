import mongoose from "mongoose";

const { Schema } = mongoose;

// Lista negra de tokens: al hacer logout el JWT se guarda aquí y el middleware de autenticación
// ya no lo acepta. Colección "blacklistedtokens"
const blacklistedTokenSchema = new Schema(
  {
    token: { type: String, required: [true, "El token es obligatorio"], unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: [true, "El usuario es obligatorio"] },
    // Cuándo caduca el token. Índice TTL: MongoDB borra el documento solo al llegar esa fecha,
    // porque a partir de ahí el token ya no vale de todas formas
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default mongoose.model("BlacklistedToken", blacklistedTokenSchema);
