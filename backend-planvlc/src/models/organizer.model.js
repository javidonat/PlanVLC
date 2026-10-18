import mongoose from "mongoose";
import { ORGANIZER_STATUSES } from "./constants.js";

const { Schema } = mongoose;

// Quién organiza el plan: discoteca, empresa de actividades, club, promotora...
const organizerSchema = new Schema(
  {
    name: { type: String, required: [true, "El nombre es obligatorio"], trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    type: {
      type: String,
      enum: { values: ["nightclub", "company", "club", "promoter"], message: "El tipo '{VALUE}' no es válido" },
      default: "company",
    },
    description: { type: String, trim: true, default: "" },
    // El logo vive en "images" (entityType "organizer", type "logo")
    // Embebido: son datos pequeños que no se reutilizan, no necesitan colección propia
    contact: {
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      website: { type: String, trim: true },
      instagram: { type: String, trim: true },
    },
    userIds: [{ type: Schema.Types.ObjectId, ref: "User" }], // usuarios que gestionan el organizador

    status: {
      type: String,
      enum: { values: ORGANIZER_STATUSES, message: "El estado '{VALUE}' no es válido" },
      default: "pending",
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Organizer", organizerSchema);
