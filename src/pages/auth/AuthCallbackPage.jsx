import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/shared/api/client'
import { useSession } from '@/features/auth/session'
import { ROLE_HOME } from '@/shared/lib/labels'
import { Button } from '@/shared/ui/button'
import { buttonStyles } from '@/shared/ui/button-styles'
import { Card, CardContent } from '@/shared/ui/card'

export default function AuthCallbackPage() {
  const setUser = useSession((state) => state.setUser)
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .get('/auth/me')
      .then((user) => {
        if (cancelled) return
        setUser(user)
        navigate(ROLE_HOME[user.role] || '/', { replace: true })
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message)
      })
    return () => {
      cancelled = true
    }
  }, [navigate, setUser])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-app px-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <p className="text-sm font-semibold text-strong">
            {error ? 'Не удалось завершить вход' : 'Завершаем авторизацию…'}
          </p>
          <p className="mt-1 text-xs text-muted">
            {error || 'Проверяем сессию и загружаем профиль.'}
          </p>
          {error ? (
            <div className="mt-4 flex justify-center gap-2">
              <Link to="/login" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
                Вернуться на вход
              </Link>
              <Button size="sm" onClick={() => window.location.reload()}>
                Повторить
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
