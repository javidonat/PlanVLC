// apiUrl apunta a la API Gateway (4000): reparte /api/ai al servicio de IA y el resto al backend
export const environment = {
  apiUrl: 'http://localhost:4000/api',
  apiTimeoutMs: 10000,
  aiTimeoutMs: 30000, // el modelo de IA tarda más en responder
};
