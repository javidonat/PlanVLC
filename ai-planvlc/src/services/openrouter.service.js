import AppError from "./utils/AppError.js";

// Única pieza que habla con OpenRouter (API compatible con la de OpenAI): https://openrouter.ai/docs
// La clave (OPENROUTER_API_KEY) solo vive en el .env de este servicio: nunca llega al navegador

const OPENROUTER_URL = process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning:free";
const TIMEOUT_MS = 25000;

// Envía la conversación al modelo y devuelve el texto de la respuesta.
// messages: [{ role: "system" | "user" | "assistant", content }]
// maxTokens: tope de tokens (razonamiento + respuesta) y timeoutMs: tiempo máximo. El análisis de opiniones necesita más que el chat
const complete = async (messages, { maxTokens = 1500, timeoutMs = TIMEOUT_MS } = {}) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AppError("El asistente no está configurado (falta la clave de OpenRouter)", 503);

  let response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "PlanVLC", // nombre de la app en el panel de OpenRouter (opcional)
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        messages,
        temperature: 0.3, // respuestas más fieles a los datos y menos "creativas"
        // Muchos modelos "piensan" antes de responder y ese razonamiento también gasta tokens:
        // que piense poco y no lo devuelva (solo queremos la respuesta). Los que no razonan lo ignoran
        reasoning: { effort: "low", exclude: true },
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error.name === "TimeoutError") throw new AppError("El asistente ha tardado demasiado en responder. Inténtalo de nuevo", 504);
    throw new AppError("No se puede conectar con el asistente. Inténtalo más tarde", 502);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    console.error(`OpenRouter ${response.status}:`, body?.error?.message ?? body);
    if (response.status === 429) throw new AppError("El asistente está recibiendo muchas preguntas. Prueba dentro de un rato", 429);
    if (response.status === 401 || response.status === 403) throw new AppError("El asistente no está bien configurado (clave de OpenRouter no válida)", 503);
    throw new AppError("El asistente no ha podido responder. Inténtalo de nuevo", 502);
  }

  const content = body?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    // finish_reason "length": se ha quedado sin tokens (normalmente, razonando)
    console.error("OpenRouter: respuesta vacía", { finish_reason: body?.choices?.[0]?.finish_reason, error: body?.error });
    throw new AppError("El asistente no ha podido responder. Inténtalo de nuevo", 502);
  }
  return content;
};

export default { complete };
