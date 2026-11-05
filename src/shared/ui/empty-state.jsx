import { Inbox } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-elevated text-muted">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-strong">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ title = 'Не удалось загрузить данные', description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        <span className="text-xl font-bold">!</span>
      </div>
      <p className="text-sm font-semibold text-strong">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs text-muted">{description}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs font-medium text-body hover:bg-elevated"
        >
          Повторить
        </button>
      ) : null}
    </div>
  )
}
