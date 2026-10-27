// Avatar por defecto del perfil: un robot de DiceBear (estilo "bottts").
// El seed es el id del usuario, así cada usuario tiene su propio robot y siempre el mismo
export const defaultAvatar = (userId) => `https://api.dicebear.com/9.x/bottts/svg?seed=${userId}`;
