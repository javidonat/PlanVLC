import organizersRepo from "../repos/organizers.repo.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

const getActiveOrganizers = async () => {
  return organizersRepo.findActive();
};

export default { getActiveOrganizers };
