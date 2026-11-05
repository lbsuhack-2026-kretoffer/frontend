import { cn } from '@/shared/lib/cn'

export function Table({ className, children, ...props }) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full min-w-[560px] border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  )
}

export function THead({ className, children, ...props }) {
  return (
    <thead className={cn('border-b border-line', className)} {...props}>
      {children}
    </thead>
  )
}

export function TBody({ className, children, ...props }) {
  return (
    <tbody className={cn('divide-y divide-line', className)} {...props}>
      {children}
    </tbody>
  )
}

export function TR({ className, children, ...props }) {
  return (
    <tr className={cn('transition-colors hover:bg-elevated/60', className)} {...props}>
      {children}
    </tr>
  )
}

export function TH({ className, children, ...props }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function TD({ className, children, ...props }) {
  return (
    <td className={cn('px-4 py-3 align-middle text-body', className)} {...props}>
      {children}
    </td>
  )
}
