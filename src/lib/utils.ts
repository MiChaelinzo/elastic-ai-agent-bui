import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const year2026Date = new Date(date)
  year2026Date.setFullYear(2026)
  return year2026Date.toLocaleString()
}
