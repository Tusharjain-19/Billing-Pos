// Sequential Bill and Token numbering compliant with GST rules

/**
 * Returns Indian Financial Year code.
 * E.g. Date in Oct 2026 => "2627" (FY 2026-27)
 * E.g. Date in Feb 2027 => "2627"
 */
export function getFinancialYearCode(date: Date = new Date()): string {
  const month = date.getMonth(); // 0 = Jan, 3 = Apr, 11 = Dec
  const fullYear = date.getFullYear();
  
  let startYear = fullYear;
  if (month < 3) {
    // Jan, Feb, Mar belong to previous calendar year's FY
    startYear = fullYear - 1;
  }
  const endYear = startYear + 1;
  
  const startStr = (startYear % 100).toString().padStart(2, '0');
  const endStr = (endYear % 100).toString().padStart(2, '0');
  return `${startStr}${endStr}`;
}

/**
 * Generates a GST-compliant bill number (max 16 characters)
 * Example: B2627-000123
 */
export function formatBillNumber(
  prefix: string = 'B',
  fyCode: string,
  seq: number
): string {
  const cleanPrefix = (prefix || 'B').toUpperCase().slice(0, 3);
  const formattedSeq = seq.toString().padStart(6, '0');
  const billNo = `${cleanPrefix}${fyCode}-${formattedSeq}`;
  return billNo.slice(0, 16);
}

/**
 * Formats order number as a 5-digit string e.g. 1 -> "00001", 42 -> "00042"
 */
export function formatOrderNumber(seq: number): string {
  return seq.toString().padStart(5, '0');
}

/**
 * Returns a date-specific key for daily-resetting order numbers.
 * E.g. Date Oct 5, 2026 => "ORDER_SEQ_20261005"
 * This ensures order number resets back to 1 every day at midnight.
 */
export function getDailyOrderKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `ORDER_SEQ_${y}${m}${d}`;
}

