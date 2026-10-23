import { randomUUID } from "crypto";
import sessionsRepo from "../../repos/sessions.repo.js";

// SKU de una sesión (la "variante" del plan): slug del plan + fecha y hora de inicio en hora de Valencia.
// Ej.: generateSku("tardeo-ruzafa", new Date("2025-10-12T17:00:00+02:00")) → "TARDEO-RUZAFA-20251012-1700"
export const generateSku = (planSlug, startDateTime) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(startDateTime))
      .map((part) => [part.type, part.value])
  );
  return `${planSlug}-${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}`.toUpperCase();
};

// Si un plan tiene dos sesiones a la misma hora, el SKU sería idéntico: se añade un sufijo aleatorio
// y se comprueba que no exista ya. Ej.: "TARDEO-RUZAFA-20251012-1700-3F9A1C2B"
export const generateUniqueSku = async (planSlug, startDateTime) => {
  let sku;
  let exists = true;

  while (exists) {
    sku = `${generateSku(planSlug, startDateTime)}-${randomUUID().slice(0, 8)}`.toUpperCase();
    exists = await sessionsRepo.skuExists(sku);
  }

  return sku;
};
