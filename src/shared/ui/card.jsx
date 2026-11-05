import { cn } from '@/shared/lib/cn'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('min-w-0 rounded-2xl border border-line bg-surface shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-4 sm:px-6 sm:pt-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h2 className={cn('text-sm font-semibold text-strong', className)} {...props}>
      {children}
    </h2>
  )
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('mt-1 text-xs text-muted', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('px-5 py-4 sm:px-6 sm:py-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 sm:px-6', className)} {...props}>
      {children}
    </div>
  )
}
