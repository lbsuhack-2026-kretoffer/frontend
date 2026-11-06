import { ArrowRight, GraduationCap } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLogin } from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { ROLE_HOME } from '@/shared/lib/labels'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { useToast } from '@/shared/ui/use-toast'
import { Field, Input } from '@/shared/ui/input'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

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

const schema = z.object({
  login: z.string().min(1, 'Введите логин или e-mail'),
  password: z.string().min(1, 'Введите пароль'),
})

export default function LoginPage() {
  const login = useLogin()
  const navigate = useNavigate()
  const user = useSession((state) => state.user)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { login: '', password: '' },
  })

  if (user) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />
  }

  const onSubmit = async (values) => {
    try {
      const logged = await login.mutateAsync({ login: values.login, password: values.password })
      toast({
        title: `Добро пожаловать, ${logged.fullName}`,
        description: `${logged.schoolName || 'Платформа'}`,
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
            {[ 'Отметка класса за пару минут с телефона', 'Заявка для КШП с буфером и категориями блюд', 'История точности прогноза и списаний' ].map((text) => (
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
              <p className="mt-1 text-sm text-muted">Введите логин (e-mail) и пароль</p>
            </div>
          </div>

          <Card className="overflow-hidden">
            {isSubmitting ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : (
              <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-3 p-4">
                <Field label="Логин / e-mail" error={errors.login?.message}>
                  <Input placeholder="ivanov@school.by" {...register('login')} autoFocus />
                </Field>
                <Field label="Пароль" type="password" error={errors.password?.message}>
                  <Input placeholder="••••••••" {...register('password')} />
                </Field>
                <Button type="submit" form="login-form" loading={isSubmitting} className="w-full">
                  Войти
                </Button>
              </form>
            )}
          </Card>
        </div>
      </section>
    </div>
  )
}
