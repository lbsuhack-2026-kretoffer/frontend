import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/shared/lib/cn'

export function Tabs({ className, ...props }) {
  return <TabsPrimitive.Root className={cn('w-full', className)} {...props} />
}

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-10 items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-3 text-xs font-medium text-muted transition-colors hover:text-strong data-[state=active]:bg-brand-500 data-[state=active]:text-black',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn('mt-4 outline-none', className)} {...props} />
}
