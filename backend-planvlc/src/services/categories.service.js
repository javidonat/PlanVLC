import categoriesRepo from "../repos/categories.repo.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

const getActiveCategories = async () => {
  return categoriesRepo.findActive();
};

export default { getActiveCategories };
