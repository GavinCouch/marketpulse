import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  retailPrice: z.number().finite().nonnegative(),
  source: z.string().min(1).max(60).optional()
});

export const productUpdateSchema = productCreateSchema.partial();

export const pricePointCreateSchema = z.object({
  price: z.number().finite().nonnegative(),
  condition: z.enum(["new", "used"]).optional(),
  platform: z.string().min(1).max(60).optional(),
  recordedAt: z.string().optional() // ISO date string
});
