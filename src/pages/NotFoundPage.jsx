import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import { buttonStyles } from '@/shared/ui/button-styles'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-app px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-elevated text-muted">
        <Compass className="h-7 w-7" />
      </div>
      <p className="mt-5 text-4xl font-semibold tracking-tight text-strong">404</p>
      <p className="mt-2 text-sm text-muted">Такой страницы нет или она была перемещена.</p>
      <Link to="/" className={buttonStyles({ variant: 'primary', size: 'md', className: 'mt-5' })}>
        <ArrowLeft className="h-4 w-4" />
        На главную
      </Link>
    </div>
  )
}
