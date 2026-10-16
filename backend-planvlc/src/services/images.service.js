import imagesRepo from "../repos/images.repo.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

const getActiveImages = async () => {
  return imagesRepo.findActive();
};

export default { getActiveImages };
