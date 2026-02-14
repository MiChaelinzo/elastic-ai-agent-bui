import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

export function getSimulatedCurrentTime(): number {
  const startDate = new Date('2025-01-01T00:00:00Z').getTime()
  const endDate = new Date('2026-02-28T23:59:59Z').getTime()
  const now = Date.now()
  
  if (now < startDate) {
    return startDate + Math.random() * (endDate - startDate)
  } else if (now > endDate) {
    return endDate - Math.random() * 86400000 * 30
  }
  return now
}
