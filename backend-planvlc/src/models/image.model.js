import mongoose from "mongoose";

const { Schema } = mongoose;

// Imágenes reutilizables (portada y galería de planes, logos de organizadores, avatares...)
const imageSchema = new Schema(
  {
    url: { type: String, required: [true, "La URL de la imagen es obligatoria"], trim: true },
    alt: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: { values: ["cover", "gallery", "logo", "avatar"], message: "El tipo '{VALUE}' no es válido" },
      default: "gallery",
    },

    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Image", imageSchema);
