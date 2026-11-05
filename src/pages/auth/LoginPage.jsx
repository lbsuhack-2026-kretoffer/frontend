import { ArrowRight, GraduationCap, Loader2, ShieldCheck, Sparkles, Utensils } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemoUsers, useLogin } from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { config } from '@/shared/config'
import { ROLE_HOME, ROLE_LABELS } from '@/shared/lib/labels'
import { Avatar } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { useToast } from '@/shared/ui/use-toast'

const ROLE_HINTS = {
  platform_admin: 'Школы, доступы, сводная статистика',
  school_admin: 'Классы, учителя, прогноз и отчёты',
  teacher: 'Отметка отсутствующих на первом уроке',
  canteen: 'Заявка на завтра и шведский стол',
  guard: 'Ручная отметка входа по пропуску',
}

const ROLE_ORDER = ['platform_admin', 'school_admin', 'teacher', 'canteen', 'guard']

const ROLE_ICONS = {
  platform_admin: ShieldCheck,
  school_admin: GraduationCap,
  teacher: Sparkles,
  canteen: Utensils,
  guard: ShieldCheck,
}

export default function LoginPage() {
  const { data, isLoading, isError, refetch } = useDemoUsers()
  const login = useLogin()
  const navigate = useNavigate()
  const user = useSession((state) => state.user)
  const { toast } = useToast()

  const grouped = useMemo(() => {
    const map = new Map()
    for (const item of data || []) {
      if (!map.has(item.role)) map.set(item.role, [])
      map.get(item.role).push(item)
    }
    return ROLE_ORDER.filter((role) => map.has(role)).map((role) => ({ role, items: map.get(role) }))
  }, [data])

  const handleLogin = async (demoUser) => {
    try {
      const logged = await login.mutateAsync(demoUser.id)
      toast({
        title: `Добро пожаловать, ${logged.fullName.split(' ')[1] || logged.fullName}`,
        description: `${ROLE_LABELS[logged.role]} · ${logged.schoolName || 'Платформа'}`,
        variant: 'success',
      })
      navigate(ROLE_HOME[logged.role] || '/', { replace: true })
    } catch (error) {
      toast({ title: 'Не удалось войти', description: error.message, variant: 'error' })
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-black p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-30" aria-hidden="true">
          <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-brand-500 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-600 blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Школьный Баланс-Пит</p>
              <p className="text-xs text-brand-500">Предиктивное питание без списаний</p>
            </div>
          </div>

          <h1 className="mt-16 max-w-lg text-balance text-4xl font-semibold leading-tight tracking-tight">
            Прогноз порций на завтра — по отметкам учителей сегодня
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-300">
            Учитель отмечает отсутствующих на первом уроке. Система считает заявку с буфером,
            разбивкой по возрастным группам и учётом постоянных отказников.
          </p>

          <div className="mt-8 grid max-w-md gap-3">
            {[
              'Отметка класса за пару минут с телефона',
              'Заявка для КШП с буфером и категориями блюд',
              'История точности прогноза и списаний',
            ].map((text) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-zinc-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <ArrowRight className="h-3 w-3" />
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-[11px] text-zinc-400">
          <ShieldCheck className="h-4 w-4" />
          Демо-стенд · данные синтетические и не покидают браузер
        </div>
      </section>

      <section className="flex items-center justify-center bg-app px-4 py-8 sm:px-8">
        <div className="w-full max-w-xl">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-black">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight text-strong">Школьный Баланс-Пит</p>
                <p className="text-[11px] text-muted">Предиктивное питание без списаний</p>
              </div>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-strong">Вход в систему</h2>
              <p className="mt-1 text-sm text-muted">
                Демо-режим: выберите роль, чтобы посмотреть сценарий.
              </p>
            </div>
            <Badge tone="warning" dot>
              Демо
            </Badge>
          </div>

          {user ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
              <p className="text-xs text-brand-400">
                Вы уже вошли как <span className="font-semibold">{user.fullName}</span>
              </p>
              <button
                type="button"
                className="text-xs font-semibold text-brand-500 underline underline-offset-2 hover:text-brand-400"
                onClick={() => navigate(ROLE_HOME[user.role] || '/')}
              >
                Продолжить
              </button>
            </div>
          ) : null}

          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : isError ? (
              <ErrorState
                title="Не удалось загрузить демо-пользователей"
                description="Проверьте, что моки запущены, и попробуйте снова."
                onRetry={refetch}
              />
            ) : !grouped.length ? (
              <EmptyState title="Нет демо-пользователей" description="Фикстуры не загрузились." />
            ) : (
              <div className="divide-y divide-line">
                {grouped.map(({ role, items }) => {
                  const Icon = ROLE_ICONS[role]
                  return (
                    <div key={role} className="p-3 sm:p-4">
                      <div className="mb-2 flex items-center gap-2 px-1">
                        <Icon className="h-3.5 w-3.5 text-brand-700" />
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                          {ROLE_LABELS[role]}
                        </p>
                        <span className="hidden text-[11px] text-subtle sm:inline">
                          — {ROLE_HINTS[role]}
                        </span>
                      </div>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            disabled={login.isPending}
                            onClick={() => handleLogin(item)}
                            className="group flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:border-line hover:bg-elevated disabled:opacity-60"
                          >
                            <Avatar name={item.fullName} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-strong">
                                {item.fullName}
                              </span>
                              <span className="block truncate text-[11px] text-muted">
                                {item.schoolName || item.position}
                                {item.classes?.length ? ` · ${item.classes.map((cls) => cls.name).join(', ')}` : ''}
                              </span>
                            </span>
                            {login.isPending && login.variables === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-brand-700" />
                            ) : (
                              <ArrowRight className="h-3.5 w-3.5 text-faint transition-colors group-hover:text-brand-700" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <div className="mt-4 rounded-xl border border-line bg-surface p-3.5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
              <div>
                <p className="text-xs font-medium text-body">
                  {config.authMode === 'mock' ? 'OAuth подключается на бэкенде' : 'Вход через OAuth'}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {config.authMode === 'mock'
                    ? 'В демо-режиме авторизация имитируется. В продакшене — OAuth 2.0 с сессией в httpOnly-cookie.'
                    : 'Вы будете перенаправлены на страницу провайдера авторизации.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
