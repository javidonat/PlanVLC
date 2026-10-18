import mongoose from "mongoose";
import { CATEGORY_STATUSES } from "./constants.js";

const { Schema } = mongoose;

// Tipo de plan: Tardeo, Discoteca, Concierto, Deporte...
const categorySchema = new Schema(
  {
    name: { type: String, required: [true, "El nombre es obligatorio"], trim: true },
    slug: { type: String, required: [true, "El slug es obligatorio"], unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: "" },
    icon: { type: String, trim: true, default: "" }, // opcional, para el frontend
    group: {
      type: String,
      enum: { values: ["nightlife", "sports", "activities", "other"], message: "El grupo '{VALUE}' no es válido" },
      default: "other",
    },
    // La imagen de portada vive en "images" (entityType "category", type "cover")

    status: {
      type: String,
      enum: { values: CATEGORY_STATUSES, message: "El estado '{VALUE}' no es válido" },
      default: "published",
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
