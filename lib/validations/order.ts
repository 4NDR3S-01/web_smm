import { z } from "zod";

/**
 * Schema de validación para crear un pedido
 */
export const createOrderSchema = z.object({
  serviceId: z
    .string()
    .min(1, "Debes seleccionar un servicio"),
  targetUrl: z
    .string()
    .min(1, "La URL es requerida")
    .url("Ingresa una URL válida")
    .refine(
      (url) => {
        // Verificar que sea una URL de red social válida
        const validDomains = [
          'instagram.com',
          'tiktok.com',
          'youtube.com',
          'facebook.com',
          'twitter.com',
          'x.com',
          'linkedin.com',
          'telegram.org',
          't.me'
        ];
        try {
          const urlObj = new URL(url);
          return validDomains.some(domain => urlObj.hostname.includes(domain));
        } catch {
          return false;
        }
      },
      { message: "La URL debe ser de una red social válida" }
    ),
  quantity: z
    .number()
    .min(1, "La cantidad mínima es 1")
    .max(1000000, "La cantidad máxima es 1,000,000"),
  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional(),
});

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
