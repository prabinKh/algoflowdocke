import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const safeToDate = (val: unknown): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "string") {
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof val === "object") {
    const obj = val as { toDate?: () => Date; seconds?: number };
    if (typeof obj.toDate === "function") return obj.toDate();
    if (typeof obj.seconds === "number") return new Date(obj.seconds * 1000);
  }
  if (typeof val === "number") {
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
};

/** Format a number as Rs. currency */
export function formatPrice(price?: number | null | string): string {
  if (price === undefined || price === null || price === '') return `Rs. 0.00`;
  
  let numPrice: number;
  if (typeof price === 'string') {
    numPrice = parseFloat(price.replace(/[^0-9.-]+/g, ""));
  } else {
    numPrice = price;
  }
  
  if (isNaN(numPrice)) return `Rs. 0.00`;
  
  return `Rs. ${numPrice.toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Safely sums an array of amount values (which might be strings from the backend)
 * to avoid JS string concatenation pitfalls.
 */
export const sumAmounts = <T extends Record<string, unknown>>(items: T[], key: keyof T): number => {
  return items.reduce((acc, item) => {
    const val = item && item[key];
    const num = typeof val === 'string' ? parseFloat(val) : (Number(val) || 0);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);
};
