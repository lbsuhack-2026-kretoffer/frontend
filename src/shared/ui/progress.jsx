import { cn } from '@/shared/lib/cn'

const tones = {
  brand: 'bg-brand-600',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  slate: 'bg-subtle',
  violet: 'bg-violet-500',
  sky: 'bg-sky-500',
}

export function Progress({ value = 0, tone = 'brand', className, label }) {
  const safe = Math.min(100, Math.max(0, Number(value) || 0))
  return (
    <div className={className}>
      {label ? <div className="mb-1 flex justify-between text-xs text-muted">{label}</div> : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
        <div
          className={cn('h-full rounded-full transition-all duration-300', tones[tone] || tones.brand)}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  )
}
