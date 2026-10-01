import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(12, "Le mot de passe doit contenir au moins 12 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir un chiffre")
  .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir un caractère spécial");