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

function StrictBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 720 960"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="login-grid" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M56 0H0V56" stroke="#facc15" strokeOpacity="0.05" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="720" height="960" fill="url(#login-grid)" />

      <path
        d="M-60 96 52 58 118 84 132 22 258 118 236 190 232 228 96 286 58 250 12 236Z"
        fill="#facc15"
        fillOpacity="0.07"
        stroke="#facc15"
        strokeOpacity="0.24"
        strokeWidth="1.25"
      />
      <path d="M12 236 96 178 232 228" stroke="#facc15" strokeOpacity="0.14" strokeWidth="1" />
      <path d="M96 286 122 210 232 228" stroke="#facc15" strokeOpacity="0.1" strokeWidth="1" />

      <path
        d="M650 74 690 52 720 42 720 196 676 186 648 176 620 142 604 128Z"
        fill="#facc15"
        fillOpacity="0.06"
        stroke="#facc15"
        strokeOpacity="0.2"
        strokeWidth="1.25"
      />

      <path
        d="M760 690 700 646 640 612 574 646 512 676 530 740 548 800 620 826 690 852 730 818 760 786Z"
        fill="#facc15"
        fillOpacity="0.06"
        stroke="#facc15"
        strokeOpacity="0.22"
        strokeWidth="1.25"
      />
      <path d="M512 676 588 732 690 852" stroke="#facc15" strokeOpacity="0.12" strokeWidth="1" />

      <path d="M0 404 66 382 116 366 168 390 214 412 268 396 322 384" stroke="#facc15" strokeOpacity="0.16" strokeWidth="1" />
      <path d="M720 470 662 490 606 508 562 492 520 478" stroke="#facc15" strokeOpacity="0.14" strokeWidth="1" />
      <path d="M470 250 502 230 526 260 500 286Z" fill="#facc15" fillOpacity="0.08" stroke="#facc15" strokeOpacity="0.3" strokeWidth="1.25" />

      <rect x="114" y="364" width="4" height="4" fill="#facc15" fillOpacity="0.4" />
      <rect x="604" y="506" width="4" height="4" fill="#facc15" fillOpacity="0.35" />
      <rect x="644" y="174" width="4" height="4" fill="#facc15" fillOpacity="0.35" />
    </svg>
  )
}

function FormBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 sm:h-96 sm:w-96"
      viewBox="0 0 320 320"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M320 0V214L292 196 264 154 224 130 178 118 142 76 110 52 70 46 34 22 0 14"
        stroke="#facc15"
        strokeOpacity="0.16"
        strokeWidth="1"
      />
      <path d="M320 96 286 78 250 86" stroke="#facc15" strokeOpacity="0.12" strokeWidth="1" />
      <path d="M222 0 210 38 236 62" stroke="#facc15" strokeOpacity="0.1" strokeWidth="1" />
    </svg>
  )
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
        <StrictBackdrop />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="facet-corner flex h-11 w-11 items-center justify-center bg-white/10">
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
                <span className="facet-corner-sm h-5 w-5 shrink-0 bg-brand-500/50 p-px">
                  <span className="facet-corner-sm flex h-full w-full items-center justify-center bg-black text-brand-400">
                    <ArrowRight className="h-3 w-3" />
                  </span>
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

      <section className="relative flex items-center justify-center overflow-hidden bg-app px-4 py-8 sm:px-8">
        <FormBackdrop />
        <div className="relative w-full max-w-xl">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="facet-corner flex h-10 w-10 items-center justify-center bg-brand-500 text-black">
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
