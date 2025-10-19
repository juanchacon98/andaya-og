/**
 * Normaliza un número de teléfono venezolano al formato E.164 (+58XXXXXXXXXX)
 * Acepta formatos como: 4241234567, 0424-123-4567, +58 424 1234567, etc.
 * @param input - Número de teléfono en cualquier formato
 * @returns Número normalizado con formato +58XXXXXXXXXX o null si es inválido
 */
export function normalizeVePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  
  // Remover todos los caracteres excepto dígitos y +
  let cleaned = input.replace(/[^\d+]/g, '');
  
  // Si empieza con +58, remover el +58
  if (cleaned.startsWith('+58')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('58')) {
    cleaned = cleaned.substring(2);
  }
  
  // Si empieza con 0, removerlo (formato local 0424...)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Validar que tenga exactamente 10 dígitos (4XX XXXXXXX)
  if (cleaned.length !== 10) {
    return null;
  }
  
  // Validar que empiece con 4 (códigos móviles venezolanos)
  if (!cleaned.startsWith('4')) {
    return null;
  }
  
  // Retornar en formato E.164
  return `+58${cleaned}`;
}

/**
 * Crea un link de WhatsApp con el número normalizado
 * @param phone - Número de teléfono a normalizar
 * @param message - Mensaje predeterminado (opcional)
 * @returns URL de WhatsApp o null si el número es inválido
 */
export function createWhatsAppLink(
  phone: string | null | undefined, 
  message?: string
): string | null {
  const normalized = normalizeVePhone(phone);
  if (!normalized) return null;
  
  const baseUrl = `https://wa.me/${normalized}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}