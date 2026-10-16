import venuesRepo from "../repos/venues.repo.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

const getActiveVenues = async () => {
  return venuesRepo.findActive();
};

export default { getActiveVenues };
