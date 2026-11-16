import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3001;

// Faltan claves: el servicio arranca, pero avisa (el chat responderá con un error claro)
if (!process.env.OPENROUTER_API_KEY) console.warn("⚠️  Falta OPENROUTER_API_KEY en el .env: el chatbot no podrá responder");
if (!process.env.GATEWAY_SECRET) console.warn("⚠️  Falta GATEWAY_SECRET en el .env: se rechazarán todas las peticiones");

// Solo escucha en localhost: desde fuera del ordenador no se puede llegar, solo a través de la gateway
app.listen(PORT, "127.0.0.1", () => {
  console.log(`🤖 Servicio de IA arrancado en http://localhost:${PORT}`);
});
