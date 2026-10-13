// Currency & Paise arithmetic helpers

export function formatPaise(
  paise: number,
  currencySymbol: '₹' | 'Rs' = '₹',
  hideDecimalsIfZero: boolean = false
): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const remainderPaise = absPaise % 100;

  // Indian number formatting with commas (e.g. 1,23,456)
  const rupeesFormatted = rupees.toLocaleString('en-IN');
  const sign = isNegative ? '-' : '';

  if (hideDecimalsIfZero && remainderPaise === 0) {
    return `${sign}${currencySymbol}${rupeesFormatted}`;
  }

  const paiseStr = remainderPaise.toString().padStart(2, '0');
  return `${sign}${currencySymbol}${rupeesFormatted}.${paiseStr}`;
}

export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const clean = rupees.replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.round(num * 100);
  }
  return isNaN(rupees) ? 0 : Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return (paise || 0) / 100;
}

export interface TaxCalculationResult {
  taxableAmount: number; // in paise
  cgst: number; // in paise
  sgst: number; // in paise
  totalTax: number; // in paise
}

export function calculateBillTaxes(
  subtotalAfterDiscount: number,
  taxMode: 'inclusive' | 'exclusive' | 'none',
  gstPercent: number = 5
): TaxCalculationResult {
  if (taxMode === 'none' || gstPercent <= 0 || subtotalAfterDiscount <= 0) {
    return {
      taxableAmount: subtotalAfterDiscount,
      cgst: 0,
      sgst: 0,
      totalTax: 0,
    };
  }

  const halfRate = gstPercent / 2;

  if (taxMode === 'inclusive') {
    // subtotal = taxableAmount * (1 + rate / 100)
    // taxableAmount = subtotal / (1 + rate / 100)
    const rateFactor = 1 + gstPercent / 100;
    const taxableAmount = Math.round(subtotalAfterDiscount / rateFactor);
    const totalTax = subtotalAfterDiscount - taxableAmount;
    const cgst = Math.round(totalTax / 2);
    const sgst = totalTax - cgst;

    return {
      taxableAmount,
      cgst,
      sgst,
      totalTax,
    };
  } else {
    // exclusive
    const taxableAmount = subtotalAfterDiscount;
    const cgst = Math.round((taxableAmount * halfRate) / 100);
    const sgst = Math.round((taxableAmount * halfRate) / 100);
    const totalTax = cgst + sgst;

    return {
      taxableAmount,
      cgst,
      sgst,
      totalTax,
    };
  }
}
