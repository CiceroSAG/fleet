import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrencySymbol(currencyCode?: string) {
  switch (currencyCode) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'ZAR': return 'R';
    case 'USD':
    case 'AUD':
    case 'CAD':
    default: return '$';
  }
}
