import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDateShort } from '@/shared/lib/date'
import { formatNumber } from '@/shared/lib/format'

const GRID = '#2b2b2b'
const TICK = '#a3a3a3'
const YELLOW = '#facc15'
const WHITE = '#fafafa'

function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-surface p-2.5 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-strong">{formatDateShort(label)}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
          <span className="font-medium text-strong">
            {formatNumber(item.value)}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  )
}

function ChartLegend({ payload }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-[11px]">
      {payload?.map((item) => (
        <span key={item.value} className="flex items-center gap-1.5 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.value}
        </span>
      ))}
    </div>
  )
}

export function ForecastChart({ data = [], height = 260, showLegend = true }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={YELLOW} stopOpacity={0.3} />
              <stop offset="95%" stopColor={YELLOW} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={WHITE} stopOpacity={0.16} />
              <stop offset="95%" stopColor={WHITE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 10, fill: TICK }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: TICK }} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#525252', strokeDasharray: '3 3' }} />
          {showLegend ? <Legend content={<ChartLegend />} /> : null}
          <Area
            type="monotone"
            dataKey="forecast"
            name="Прогноз"
            stroke={YELLOW}
            strokeWidth={2}
            fill="url(#forecastFill)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="actual"
            name="Факт"
            stroke={WHITE}
            strokeWidth={2}
            fill="url(#actualFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function WasteChart({ data = [], height = 220 }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 10, fill: TICK }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: TICK }} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<ChartTooltip suffix=" порц." />} cursor={{ fill: 'rgba(250, 204, 21, 0.08)' }} />
          <Bar dataKey="wastePortions" name="Списание" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryChart({ data = [], height = 220 }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: TICK }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={92}
            tick={{ fontSize: 11, fill: '#d4d4d4' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip suffix=" шт." />} cursor={{ fill: 'rgba(250, 204, 21, 0.08)' }} />
          <Bar dataKey="qty" name="Прогноз" fill={YELLOW} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
