import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const COUNT_WORDS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight']

/** Small counts as words for editorial copy ("Three campaigns"); digits past eight. */
export function countWord(n: number): string {
  return COUNT_WORDS[n - 1] ?? String(n)
}
