import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { useSession } from '@/features/auth/session'
import { ROLE_HOME } from '@/shared/lib/labels'
import { buttonStyles } from '@/shared/ui/button-styles'

export default function ForbiddenPage() {
  const user = useSession((state) => state.user)
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-app px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-strong">Нет доступа</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        У вашей роли нет прав на этот раздел. Вернитесь на свой рабочий экран.
      </p>
      <Link
        to={user ? ROLE_HOME[user.role] || '/' : '/login'}
        className={buttonStyles({ variant: 'primary', size: 'md', className: 'mt-5' })}
      >
        <ArrowLeft className="h-4 w-4" />
        На главную
      </Link>
    </div>
  )
}
