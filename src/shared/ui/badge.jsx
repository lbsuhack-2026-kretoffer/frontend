import { cn } from '@/shared/lib/cn'

const tones = {
  neutral: 'bg-elevated text-body ring-line',
  brand: 'bg-brand-50 text-brand-800 ring-brand-200',
  success: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  danger: 'bg-red-500/10 text-red-300 ring-red-500/30',
  info: 'bg-blue-500/10 text-blue-300 ring-blue-500/30',
  sky: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
  violet: 'bg-violet-500/10 text-violet-300 ring-violet-500/30',
  outline: 'bg-surface text-muted ring-line',
}

export function Badge({ tone = 'neutral', className, children, dot = false, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        tones[tone] || tones.neutral,
        className,
      )}
      {...props}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

export default Badge
