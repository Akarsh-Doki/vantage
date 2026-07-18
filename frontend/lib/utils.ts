import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const COUNT_WORDS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight']

/** Small counts as words for editorial copy ("Three campaigns"). Digits past eight. */
export function countWord(n: number): string {
  return COUNT_WORDS[n - 1] ?? String(n)
}

/** "Jul 7, 2026" from an ISO timestamp. Empty string when unparseable. */
export function formatReportDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Download filename base for the exported PDF, like "Company - Report name",
 * collapsing to one part when they match or one is missing. Characters that
 * are illegal in filenames are stripped and whitespace collapsed, so the
 * result is always a valid name (the browser appends .pdf).
 */
export function pdfFileName(
  company: string | null | undefined,
  report: string | null | undefined,
): string {
  const clean = (value: string) =>
    value
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\\/:*?"<>|]/g, ' ')
      .replace(/[\u0000-\u001f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  const companyPart = clean(company ?? '')
  const reportPart = clean(report ?? '')
  const base =
    companyPart && reportPart && companyPart !== reportPart
      ? `${companyPart} - ${reportPart}`
      : companyPart || reportPart || 'Vantage report'
  return base.slice(0, 120).trim()
}
