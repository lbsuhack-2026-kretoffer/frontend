import { cn } from '@/shared/lib/cn'

export function PageHeader({ title, description, actions, eyebrow, className }) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700">{eyebrow}</p>
        ) : null}
        <h1 className="text-balance text-xl font-semibold tracking-tight text-strong sm:text-2xl">
          {title}
        </h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 no-print">{actions}</div> : null}
    </div>
  )
}
