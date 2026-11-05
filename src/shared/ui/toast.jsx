import { useCallback, useMemo, useState } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { ToastContext } from '@/shared/ui/use-toast'

const variants = {
  default: {
    icon: Info,
    className: 'border-line bg-surface text-strong',
    iconClassName: 'text-brand-600',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-500/30 bg-surface text-strong',
    iconClassName: 'text-emerald-400',
  },
  error: {
    icon: AlertTriangle,
    className: 'border-red-500/30 bg-surface text-strong',
    iconClassName: 'text-red-400',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((options) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((current) => [...current, { id, variant: 'default', ...options }])
    return id
  }, [])

  const value = useMemo(() => ({ toast, remove }), [toast, remove])

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((item) => {
          const variant = variants[item.variant] || variants.default
          const Icon = variant.icon
          return (
            <ToastPrimitive.Root
              key={item.id}
              data-slot="toast"
              open
              duration={item.duration ?? 4200}
              onOpenChange={(open) => {
                if (!open) remove(item.id)
              }}
              className={cn(
                'pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-3.5 shadow-lg',
                variant.className,
              )}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', variant.iconClassName)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <ToastPrimitive.Title className="text-sm font-semibold">{item.title}</ToastPrimitive.Title>
                {item.description ? (
                  <ToastPrimitive.Description className="mt-0.5 text-xs text-muted">
                    {item.description}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
              <ToastPrimitive.Close
                className="rounded-md p-1 text-subtle transition-colors hover:bg-elevated hover:text-body"
                aria-label="Закрыть уведомление"
              >
                <X className="h-3.5 w-3.5" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          )
        })}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}
