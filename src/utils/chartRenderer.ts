/**
 * Pure HTML5 Canvas Chart Renderer for PDF Reports & Visual Dossiers.
 * Produces crisp, professional vector-like charts without heavy external dependencies.
 */

export interface ChartDayEntry {
  dateStr: string;
  amountPaise: number;
  count: number;
}

export interface ChartPaymentEntry {
  mode: string;
  amountPaise: number;
  count: number;
  color: string;
}

export interface ChartDishEntry {
  name: string;
  qty: number;
  revenuePaise: number;
}

/**
 * Renders a clean Daily Sales Bar Chart to a PNG Data URL
 */
export function renderRevenueTrendChart(
  entries: ChartDayEntry[],
  width = 800,
  height = 280
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Border & Header
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Daily Revenue Trajectory (₹)', 24, 28);

  const displayEntries = entries.slice(-14); // Last 14 days or points
  if (displayEntries.length === 0) {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px sans-serif';
    ctx.fillText('No transaction data in selected period', 24, 60);
    return canvas.toDataURL('image/png');
  }

  const maxVal = Math.max(...displayEntries.map((e) => e.amountPaise), 100);
  const chartLeft = 50;
  const chartRight = width - 30;
  const chartTop = 50;
  const chartBottom = height - 45;
  const chartHeight = chartBottom - chartTop;
  const chartWidth = chartRight - chartLeft;

  // Horizontal Grid Lines
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 1;
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const y = chartBottom - (chartHeight / gridSteps) * i;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();

    // Y Axis Label
    const stepVal = (maxVal / gridSteps) * i;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    const label = stepVal >= 100000 ? `₹${(stepVal / 100000).toFixed(1)}k` : `₹${Math.round(stepVal / 100)}`;
    ctx.fillText(label, chartLeft - 8, y + 3);
  }

  // Draw Bars
  const barCount = displayEntries.length;
  const slotWidth = chartWidth / barCount;
  const barWidth = Math.min(36, slotWidth * 0.65);

  displayEntries.forEach((entry, idx) => {
    const barHeight = Math.max(4, (entry.amountPaise / maxVal) * chartHeight);
    const x = chartLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
    const y = chartBottom - barHeight;

    // Bar Gradient
    const grad = ctx.createLinearGradient(0, y, 0, chartBottom);
    grad.addColorStop(0, '#2563EB');
    grad.addColorStop(1, '#3B82F6');
    ctx.fillStyle = grad;

    // Rounded top rect
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(x, chartBottom);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, chartBottom);
    ctx.closePath();
    ctx.fill();

    // Value on top of bar
    if (barHeight > 18 && barWidth >= 20) {
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      const valStr = `₹${Math.round(entry.amountPaise / 100)}`;
      ctx.fillText(valStr, x + barWidth / 2, y - 5);
    }

    // X Axis Label (Date)
    ctx.fillStyle = '#64748B';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(entry.dateStr, x + barWidth / 2, chartBottom + 18);
  });

  return canvas.toDataURL('image/png');
}

/**
 * Renders Payment Split (Donut Chart) to a PNG Data URL
 */
export function renderPaymentModeDonutChart(
  entries: ChartPaymentEntry[],
  width = 460,
  height = 280
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Payment Mode Split', 24, 28);

  const totalPaise = entries.reduce((acc, e) => acc + e.amountPaise, 0);
  if (totalPaise === 0) {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px sans-serif';
    ctx.fillText('No payment data available', 24, 60);
    return canvas.toDataURL('image/png');
  }

  const centerX = 130;
  const centerY = 150;
  const outerRadius = 78;
  const innerRadius = 46;

  let currentAngle = -0.5 * Math.PI;

  entries.forEach((entry) => {
    if (entry.amountPaise <= 0) return;
    const sliceAngle = (entry.amountPaise / totalPaise) * 2 * Math.PI;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
    ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = entry.color;
    ctx.fill();

    currentAngle += sliceAngle;
  });

  // Center text
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`₹${Math.round(totalPaise / 100)}`, centerX, centerY + 2);
  ctx.fillStyle = '#64748B';
  ctx.font = '9px sans-serif';
  ctx.fillText('TOTAL', centerX, centerY + 14);

  // Legend on right side
  let legendY = 65;
  ctx.textAlign = 'left';

  entries.forEach((entry) => {
    if (entry.amountPaise <= 0) return;
    const pct = ((entry.amountPaise / totalPaise) * 100).toFixed(1);

    // Color swatch
    ctx.fillStyle = entry.color;
    ctx.beginPath();
    ctx.roundRect(240, legendY - 9, 12, 12, 3);
    ctx.fill();

    // Mode name & %
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`${entry.mode.toUpperCase()} (${pct}%)`, 260, legendY + 1);

    // Amount & orders
    ctx.fillStyle = '#64748B';
    ctx.font = '10px sans-serif';
    ctx.fillText(`₹${(entry.amountPaise / 100).toFixed(2)} • ${entry.count} txns`, 260, legendY + 16);

    legendY += 38;
  });

  return canvas.toDataURL('image/png');
}

/**
 * Renders Top Selling Menu Items (Horizontal Bar Chart) to a PNG Data URL
 */
export function renderDishVelocityChart(
  dishes: ChartDishEntry[],
  width = 460,
  height = 280
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Top 5 Best-Selling Dishes', 24, 28);

  const topDishes = dishes.slice(0, 5);
  if (topDishes.length === 0) {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px sans-serif';
    ctx.fillText('No menu sales recorded', 24, 60);
    return canvas.toDataURL('image/png');
  }

  const maxQty = Math.max(...topDishes.map((d) => d.qty), 1);
  const startY = 60;
  const barSpacing = 42;
  const barHeight = 16;
  const maxBarWidth = 230;

  topDishes.forEach((dish, idx) => {
    const y = startY + idx * barSpacing;
    const barWidth = Math.max(12, (dish.qty / maxQty) * maxBarWidth);

    // Rank & Name
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    const truncatedName = dish.name.length > 20 ? dish.name.slice(0, 19) + '…' : dish.name;
    ctx.fillText(`#${idx + 1} ${truncatedName}`, 24, y);

    // Bar background track
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.roundRect(24, y + 6, maxBarWidth, barHeight, 4);
    ctx.fill();

    // Value bar
    const grad = ctx.createLinearGradient(24, 0, 24 + barWidth, 0);
    grad.addColorStop(0, '#10B981');
    grad.addColorStop(1, '#059669');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(24, y + 6, barWidth, barHeight, 4);
    ctx.fill();

    // Quantity & Revenue labels
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 10.5px sans-serif';
    ctx.fillText(`${dish.qty} sold`, maxBarWidth + 34, y + 18);

    ctx.fillStyle = '#2563EB';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`₹${(dish.revenuePaise / 100).toFixed(0)}`, width - 24, y + 18);
  });

  return canvas.toDataURL('image/png');
}
