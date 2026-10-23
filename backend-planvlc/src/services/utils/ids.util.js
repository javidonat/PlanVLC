// Ids que se añaden ahora a una relación (los que no estaban en currentIds).
// Sirve para las reglas de status: lo que ya estaba relacionado se queda aunque cambie de estado,
// pero no se puede añadir algo nuevo que esté archivado, cerrado, suspendido...
export const addedIds = (ids, currentIds = []) => {
  const current = new Set(currentIds.map(String));
  return ids.filter((id) => !current.has(String(id)));
};
