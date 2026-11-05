import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const controlClass =
  'w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm text-strong shadow-sm placeholder:text-subtle transition-colors hover:border-brand-500/50 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:bg-app disabled:text-muted'

export const Input = forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return <input ref={ref} type={type} className={cn(controlClass, 'h-10', className)} {...props} />
})

export const Textarea = forwardRef(function Textarea({ className, rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(controlClass, 'min-h-20 resize-y', className)} {...props} />
})

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className={cn('relative', className)}>
      <select ref={ref} className={cn(controlClass, 'h-10 appearance-none pr-9')} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
        aria-hidden="true"
      />
    </div>
  )
})

export function Label({ className, children, ...props }) {
  return (
    <label className={cn('mb-1.5 block text-xs font-medium text-body', className)} {...props}>
      {children}
    </label>
  )
}

export function Field({ label, error, hint, htmlFor, className, children }) {
  return (
    <div className={className}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}
