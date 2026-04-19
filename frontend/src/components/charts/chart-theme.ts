/**
 * Recharts theme constants for Crave & Co design system.
 * Import these when configuring any Recharts chart.
 */

export const chartColors = {
  primary: '#C9A646',
  secondary: '#3498DB',
  tertiary: '#A0A0A0',
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  grid: '#222222',
  text: '#A0A0A0',
  background: 'transparent',
} as const;

export const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: '#1A1A1A',
    border: '1px solid #222222',
    borderRadius: '12px',
    padding: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  labelStyle: {
    color: '#A0A0A0',
    fontSize: '12px',
    fontWeight: 500,
    marginBottom: '4px',
  },
  itemStyle: {
    color: '#FFFFFF',
    fontSize: '13px',
  },
} as const;

export const chartAxisStyle = {
  tick: { fill: '#A0A0A0', fontSize: 12 },
  axisLine: { stroke: '#222222' },
  tickLine: false as const,
} as const;

export const chartGridStyle = {
  stroke: '#222222',
  strokeDasharray: '3 3',
  vertical: false as const,
} as const;

/**
 * Generate a gold gradient definition for area charts.
 * Use inside <defs> in your chart:
 *
 * ```tsx
 * <defs>
 *   <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
 *     <stop offset="0%" stopColor="#C9A646" stopOpacity={0.15} />
 *     <stop offset="100%" stopColor="#C9A646" stopOpacity={0} />
 *   </linearGradient>
 * </defs>
 * <Area fill="url(#goldGradient)" stroke="#C9A646" />
 * ```
 */
export const goldGradientStops = {
  start: { offset: '0%', stopColor: '#C9A646', stopOpacity: 0.15 },
  end: { offset: '100%', stopColor: '#C9A646', stopOpacity: 0 },
} as const;
