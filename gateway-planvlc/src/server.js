import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 4000;

if (!process.env.GATEWAY_SECRET) console.warn("⚠️  Falta GATEWAY_SECRET en el .env: el servicio de IA rechazará las peticiones");

app.listen(PORT, () => {
  console.log(`🚪 API Gateway arrancada en http://localhost:${PORT}`);
  console.log(`   /api/ai/* → ${app.locals.aiServiceUrl}`);
  console.log(`   /api/*    → ${app.locals.backendUrl}`);
});
