import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CreditCard, DoorOpen, Save } from 'lucide-react'
import { useSchool, useUpdateSchool } from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { Avatar } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { ErrorState } from '@/shared/ui/empty-state'
import { Field, Input, Select } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { Switch } from '@/shared/ui/switch'
import { useToast } from '@/shared/ui/use-toast'
import { MEAL_PLAN_LABELS } from '@/shared/lib/labels'

const schema = z.object({
  name: z.string().min(2, 'Укажите название'),
  city: z.string().min(2, 'Укажите город'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email('Некорректный e-mail'), z.literal('')]).optional(),
  timezone: z.string().min(1),
  mealPlan: z.enum(['fixed', 'canteen']),
  bufferPercent: z.coerce.number().min(0, 'Минимум 0').max(30, 'Максимум 30'),
  attendanceDeadline: z.string().min(1),
})

export default function SchoolSettingsPage() {
  const user = useSession((state) => state.user)
  const schoolQuery = useSchool(user?.schoolId)
  const updateSchool = useUpdateSchool()
  const { toast } = useToast()
  const [integrationPending, setIntegrationPending] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!schoolQuery.data) return
    const school = schoolQuery.data
    reset({
      name: school.name,
      city: school.city,
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
      timezone: school.timezone,
      mealPlan: school.mealPlan,
      bufferPercent: school.bufferPercent,
      attendanceDeadline: school.attendanceDeadline,
    })
  }, [schoolQuery.data, reset])

  if (schoolQuery.isLoading) return <PageSkeleton />
  if (schoolQuery.isError) {
    return <ErrorState description={schoolQuery.error.message} onRetry={schoolQuery.refetch} />
  }

  const school = schoolQuery.data

  const onSubmit = async (values) => {
    try {
      await updateSchool.mutateAsync({
        schoolId: school.id,
        payload: { ...values, bufferPercent: Number(values.bufferPercent) },
      })
      toast({ title: 'Настройки сохранены', variant: 'success' })
      reset(values)
    } catch (error) {
      toast({ title: 'Не удалось сохранить', description: error.message, variant: 'error' })
    }
  }

  const toggleIntegration = async (key, checked) => {
    setIntegrationPending(key)
    try {
      await updateSchool.mutateAsync({
        schoolId: school.id,
        payload: { integrations: { [key]: checked } },
      })
      toast({
        title: checked ? 'Интеграция включена' : 'Интеграция отключена',
        variant: 'success',
      })
    } catch (error) {
      toast({ title: 'Не удалось изменить интеграцию', description: error.message, variant: 'error' })
    } finally {
      setIntegrationPending(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Школа"
        title="Настройки"
        description="Параметры школы, схема питания и интеграции. Изменения применяются к прогнозу."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Общие данные</CardTitle>
                <p className="mt-1 text-xs text-muted">Название и контакты школы</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 pt-2 sm:grid-cols-2">
              <Field label="Название" error={errors.name?.message} className="sm:col-span-2">
                <Input {...register('name')} />
              </Field>
              <Field label="Город" error={errors.city?.message}>
                <Input {...register('city')} />
              </Field>
              <Field label="Адрес" error={errors.address?.message}>
                <Input {...register('address')} />
              </Field>
              <Field label="Телефон" error={errors.phone?.message}>
                <Input {...register('phone')} />
              </Field>
              <Field label="E-mail" error={errors.email?.message}>
                <Input {...register('email')} />
              </Field>
              <Field label="Таймзона" error={errors.timezone?.message}>
                <Select {...register('timezone')}>
                  <option value="Europe/Minsk">Europe/Minsk</option>
                  <option value="Europe/Moscow">Europe/Moscow</option>
                  <option value="Asia/Almaty">Asia/Almaty</option>
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Питание и прогноз</CardTitle>
                <p className="mt-1 text-xs text-muted">Схема питания, буфер и дедлайн отметок</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 pt-2 sm:grid-cols-2">
              <Field label="Схема питания" error={errors.mealPlan?.message}>
                <Select {...register('mealPlan')}>
                  <option value="fixed">{MEAL_PLAN_LABELS.fixed}</option>
                  <option value="canteen">{MEAL_PLAN_LABELS.canteen}</option>
                </Select>
              </Field>
              <Field label="Буфер на погрешность, %" error={errors.bufferPercent?.message} hint="0–30%">
                <Input type="number" min="0" max="30" {...register('bufferPercent')} />
              </Field>
              <Field label="Дедлайн отметки" error={errors.attendanceDeadline?.message} hint="После дедлайна отметки считаются опоздавшими">
                <Input type="time" {...register('attendanceDeadline')} />
              </Field>
              <div className="rounded-xl bg-app p-3 text-[11px] text-muted">
                При шведском столе прогноз дополнительно разбивается по категориям блюд. Для фиксированного питания
                считается общее число порций.
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              <Save className="h-4 w-4" />
              Сохранить настройки
            </Button>
          </div>
        </div>

        <div className="grid gap-4 self-start">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Интеграции</CardTitle>
                <p className="mt-1 text-xs text-muted">Данные для прогноза и автоматизации</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-start gap-3 rounded-xl border border-line p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-strong">Касса / электронная оплата</p>
                  <p className="mt-0.5 text-[11px] text-muted">Транзакции шведского стола</p>
                </div>
                <Switch
                  checked={Boolean(school.integrations?.pos)}
                  onCheckedChange={(checked) => toggleIntegration('pos', checked)}
                  disabled={integrationPending === 'pos'}
                  aria-label="Интеграция с кассой"
                />
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-line p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted">
                  <DoorOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-strong">СКУД / турникеты</p>
                  <p className="mt-0.5 text-[11px] text-muted">Автоматическая отметка входа</p>
                </div>
                <Switch
                  checked={Boolean(school.integrations?.skud)}
                  onCheckedChange={(checked) => toggleIntegration('skud', checked)}
                  disabled={integrationPending === 'skud'}
                  aria-label="Интеграция со СКУД"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Администраторы</CardTitle>
                <p className="mt-1 text-xs text-muted">Управление доступом — у платформы</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {!school.admins?.length ? (
                <p className="text-xs text-muted">Администраторы не назначены.</p>
              ) : (
                school.admins.map((admin) => (
                  <div key={admin.id} className="flex items-center gap-2.5 rounded-xl bg-app p-2.5">
                    <Avatar name={admin.fullName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-strong">{admin.fullName}</p>
                      <p className="truncate text-[11px] text-muted">{admin.email}</p>
                    </div>
                    <Badge tone="brand">Завуч</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-line bg-elevated/70 p-4">
            <p className="text-xs font-semibold text-strong">Бесплатный сервис</p>
            <p className="mt-1 text-[11px] text-muted">
              Платформа не использует тарифы и подписки. Доступ школы управляется администратором платформы.
            </p>
          </div>
        </div>
      </form>
    </>
  )
}
