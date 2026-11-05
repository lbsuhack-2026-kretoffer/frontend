import { cn } from '@/shared/lib/cn'

const variants = {
  primary:
    'bg-brand-500 text-black shadow-sm hover:bg-brand-400 active:bg-brand-600 disabled:bg-line-strong disabled:text-muted',
  secondary:
    'border border-line-strong bg-elevated text-strong shadow-sm hover:bg-line active:bg-line-strong disabled:text-faint',
  outline:
    'border border-line-strong bg-transparent text-body shadow-sm hover:bg-elevated hover:text-strong active:bg-line disabled:text-faint',
  ghost: 'text-muted hover:bg-elevated hover:text-strong active:bg-line disabled:text-faint',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 disabled:bg-red-900 disabled:text-red-300',
  'danger-outline':
    'border border-red-500/40 bg-transparent text-red-400 hover:bg-red-500/10 active:bg-red-500/15 disabled:text-red-500/40',
}

const sizes = {
  sm: 'h-9 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-sm',
  icon: 'h-10 w-10 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
}

export function buttonStyles({ variant = 'primary', size = 'md', className } = {}) {
  return cn(
    'inline-flex select-none items-center justify-center font-medium transition-colors disabled:cursor-not-allowed [&_svg]:shrink-0',
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    className,
  )
}
