export function formatBs(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Bs 0,00';
  
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value).replace('VES', 'Bs');
}

export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatEur(value: number | null | undefined): string {
  if (value === null || value === undefined) return '€0.00';
  
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function convertTo(
  target: 'USD' | 'EUR' | 'VES',
  amount: number,
  rateValue: number,
  sourceCode: string = 'VES'
): number {
  if (target === sourceCode) return amount;
  
  if (target === 'VES') {
    // Convertir de USD/EUR a VES
    return amount * rateValue;
  } else {
    // Convertir de VES a USD/EUR
    return amount / rateValue;
  }
}

export function formatCurrency(
  value: number | null | undefined,
  code: 'USD' | 'EUR' | 'VES'
): string {
  if (code === 'USD') return formatUsd(value);
  if (code === 'EUR') return formatEur(value);
  return formatBs(value);
}