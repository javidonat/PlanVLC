import mongoose from "mongoose";
import { USER_STATUSES } from "./constants.js";

const { Schema } = mongoose;

// Usuarios del sistema. El rol va en el usuario (users.roleId), no al revés.
const userSchema = new Schema(
  {
    name: { type: String, required: [true, "El nombre es obligatorio"], trim: true },
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "El email no es válido"],
    },
    // NUNCA la contraseña en claro: aquí va el hash. select:false evita devolverlo en las consultas
    passwordHash: { type: String, required: [true, "La contraseña es obligatoria"], select: false },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: [true, "El rol es obligatorio"] },
    // El avatar vive en "images" (entityType "user", type "avatar")
    lastLoginAt: { type: Date, default: null },

    status: {
      type: String,
      enum: { values: USER_STATUSES, message: "El estado '{VALUE}' no es válido" },
      default: "active",
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
