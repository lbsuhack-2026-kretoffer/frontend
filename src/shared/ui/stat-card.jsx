import { cn } from '@/shared/lib/cn'

const tones = {
  brand: 'bg-brand-50 text-brand-700',
  emerald: 'bg-emerald-500/10 text-emerald-300',
  amber: 'bg-amber-500/10 text-amber-300',
  blue: 'bg-blue-500/10 text-blue-300',
  red: 'bg-red-500/10 text-red-300',
  slate: 'bg-elevated text-muted',
  violet: 'bg-violet-500/10 text-violet-300',
  sky: 'bg-sky-500/10 text-sky-300',
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand', className }) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-strong">{value}</p>
        </div>
        {Icon ? (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}
