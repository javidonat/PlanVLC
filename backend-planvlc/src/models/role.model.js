import mongoose from "mongoose";

const { Schema } = mongoose;

// Rol de un usuario: admin, editor, organizer, user
const roleSchema = new Schema(
  {
    name: { type: String, required: [true, "El nombre es obligatorio"], unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: "" },
    permissions: [{ type: String, trim: true }], // opcional. Ej: "plans:write"

    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Role", roleSchema);
