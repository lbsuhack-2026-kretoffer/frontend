import { Loader2 } from 'lucide-react'

export default function RouteFallback() {
  return (
    <div className="flex min-h-[40dvh] items-center justify-center" role="status" aria-label="Загрузка">
      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
    </div>
  )
}
