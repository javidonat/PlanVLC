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
  {
    timestamps: true,
    // Incluye el virtual avatar al devolver el usuario en JSON (id: false evita el virtual "id").
    // El hash de la contraseña no sale nunca en el JSON, aunque se haya leído
    id: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Avatar del usuario (relación inversa: images.entityId → users._id)
userSchema.virtual("avatar", {
  ref: "Image",
  localField: "_id",
  foreignField: "entityId",
  justOne: true,
  match: { entityType: "user", type: "avatar", isActive: true, deletedAt: null },
});

// Perfil del usuario (relación inversa: profiles.userId → users._id). El panel muestra su avatar
userSchema.virtual("profile", {
  ref: "Profile",
  localField: "_id",
  foreignField: "userId",
  justOne: true,
});

export default mongoose.model("User", userSchema);
