import slugify from "slugify";

export const generateSlug = (value) => {
  return slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  });
};