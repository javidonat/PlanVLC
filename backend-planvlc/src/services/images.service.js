import imagesRepo from "../repos/images.repo.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

const getActiveImages = async () => {
  return imagesRepo.findActive();
};

// Deja las imágenes de un tipo de una entidad exactamente como la lista de URLs recibida (en ese orden).
// Sirve para cualquier entidad: replaceImages("plan", plan._id, "gallery", [url1, url2], plan.title)
// - Las URLs que ya existían se conservan (solo se actualiza su posición).
// - Las nuevas se crean.
// - Las que ya no están se eliminan con soft delete.
const replaceImages = async (entityType, entityId, type, urls, alt = "") => {
  const wanted = [...new Set(urls)];
  const current = await imagesRepo.findByEntity(entityType, entityId, type);
  const currentByUrl = new Map(current.map((image) => [image.url, image]));

  const kept = new Set();
  const toCreate = [];
  const positionUpdates = [];

  wanted.forEach((url, position) => {
    const existing = currentByUrl.get(url);
    if (existing) {
      kept.add(String(existing._id));
      if (existing.position !== position) positionUpdates.push(imagesRepo.updatePosition(existing._id, position));
    } else {
      toCreate.push({ url, alt, entityType, entityId, type, position });
    }
  });

  const toDelete = current.filter((image) => !kept.has(String(image._id))).map((image) => image._id);

  await imagesRepo.softDeleteMany(toDelete);
  await Promise.all(positionUpdates);
  await imagesRepo.createMany(toCreate);
};

export default { getActiveImages, replaceImages };
