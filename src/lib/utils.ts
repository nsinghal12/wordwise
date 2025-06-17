import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWordsForSpellCheck(text: string): string[] {
  const wordRegex = /[a-zA-Z0-9'-]+/g;
  const matches = text.match(wordRegex);
  return matches || [];
}