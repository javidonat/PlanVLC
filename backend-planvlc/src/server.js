import "dotenv/config";
import app from "./app.js";
import conectarDB from "./config/db.js";

const PORT = process.env.PORT || 3000;

// Primero conectamos a MongoDB, luego arrancamos el servidor
conectarDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor arrancado en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error al iniciar:", err);
    process.exit(1);
  });
