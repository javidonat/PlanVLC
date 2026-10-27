import mongoose from "mongoose";

const { Schema } = mongoose;

// Datos extendidos del usuario (User 1 → 1 Profile). El perfil apunta al usuario, no al revés.
const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: [true, "El usuario es obligatorio"], unique: true },
    firstName: { type: String, trim: true, maxlength: 100, default: null },
    lastName: { type: String, trim: true, maxlength: 100, default: null },
    phone: { type: String, trim: true, maxlength: 30, default: null },
    bio: { type: String, trim: true, maxlength: 2000, default: null },
    // URL de la imagen del avatar. Al crear el perfil se pone un robot (services/utils/avatar.js)
    avatar: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Profile", profileSchema);
