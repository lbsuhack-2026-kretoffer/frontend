import { cn } from '@/shared/lib/cn'
import { initials } from '@/shared/lib/format'

const sizes = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
}

export function Avatar({ name, size = 'md', className }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-brand-500/15 font-semibold text-brand-400',
        sizes[size] || sizes.md,
        className,
      )}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </div>
  )
}
