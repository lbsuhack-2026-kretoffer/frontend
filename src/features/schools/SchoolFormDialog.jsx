import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreateSchool, useUpdateSchool } from '@/api/hooks'
import { useToast } from '@/shared/ui/use-toast'
import { Dialog } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Field, Input, Select } from '@/shared/ui/input'

const baseSchema = z.object({
  name: z.string().min(2, 'Укажите название школы'),
  city: z.string().min(2, 'Укажите город'),
  district: z.string().min(1, 'Укажите район'),
  address: z.string().min(5, 'Укажите адрес школы'),
  phone: z
    .string()
    .min(1, 'Укажите телефон')
    .refine(
      (val) => /^\+?\d[\d\s-()]{6,}$/.test(val),
      'Некорректный номер телефона',
    ),
  email: z.string().email('Некорректный e-mail'),
  mealPlan: z.enum(['fixed', 'canteen'], { required_error: 'Выберите схему питания' }),
  timezone: z.string().min(1, 'Укажите часовой пояс'),
  bufferPercent: z.coerce.number().min(0, 'Минимум 0%').max(30, 'Максимум 30%'),
  attendanceDeadline: z.string().min(1, 'Укажите дедлайн отметки'),
})

const createSchema = baseSchema.extend({
  adminFullName: z.string().min(2, 'Укажите ФИО завуча').optional(),
  adminEmail: z.string().email('Некорректный e-mail').optional(),
  adminPassword: z.string().min(6, 'Пароль не менее 6 символов').optional(),
  adminPasswordConfirm: z.string().optional(),
}).refine((data) => {
  if (!data.adminPassword && !data.adminPasswordConfirm) return true
  if (data.adminPassword !== data.adminPasswordConfirm) return false
  return true
}, {
  message: 'Пароли не совпадают',
  path: ['adminPasswordConfirm'],
})

const defaultCreate = {
  name: '',
  city: 'Минск',
  address: '',
  phone: '',
  email: '',
  mealPlan: 'fixed',
  timezone: 'Europe/Minsk',
  bufferPercent: 10,
  attendanceDeadline: '09:30',
  adminFullName: '',
  adminEmail: '',
  adminPassword: '',
  adminPasswordConfirm: '',
}

function SchoolFields({ register, errors, includeAdmin = false }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Название школы" error={errors.name?.message} className="sm:col-span-2">
        <Input placeholder="Гимназия №12" {...register('name')} maxLength="128" />
      </Field>
      <Field label="Город" error={errors.city?.message}>
        <Input placeholder="Минск" {...register('city')} maxLength="64" />
      </Field>
      <Field label="Район" error={errors.district?.message}>
        <Input placeholder="Центральный" {...register('district')} maxLength="128" />
      </Field>
      <Field label="Адрес" error={errors.address?.message}>
        <Input placeholder="ул. Кропоткина, 12" {...register('address')} maxLength="256" />
      </Field>
      <Field label="Телефон" error={errors.phone?.message}>
        <Input placeholder="+375 17 ..." {...register('phone')} maxLength="32" />
      </Field>
      <Field label="E-mail школы" error={errors.email?.message}>
        <Input placeholder="school@edu.by" {...register('email')} maxLength="128" />
      </Field>
      <Field label="Схема питания" error={errors.mealPlan?.message}>
        <Select {...register('mealPlan')}>
          <option value="fixed">Фиксированное питание</option>
          <option value="canteen">Шведский стол</option>
        </Select>
      </Field>
      <Field label="Таймзона" error={errors.timezone?.message}>
        <Select {...register('timezone')}>
          <option value="Europe/Minsk">Europe/Minsk</option>
          <option value="Europe/Moscow">Europe/Moscow</option>
          <option value="Asia/Almaty">Asia/Almaty</option>
        </Select>
      </Field>
      <Field label="Буфер, %" error={errors.bufferPercent?.message} hint="Запас порций на погрешность прогноза">
        <Input type="number" min="0" max="30" step="1" {...register('bufferPercent')} />
      </Field>
      <Field label="Дедлайн отметки" error={errors.attendanceDeadline?.message}>
        <Input type="time" {...register('attendanceDeadline')} />
      </Field>
      {includeAdmin ? (
        <>
          <Field label="ФИО завуча" error={errors.adminFullName?.message}>
            <Input placeholder="Иван Петров" {...register('adminFullName')} maxLength="256" />
          </Field>
          <Field label="Логин завуча (e-mail)" error={errors.adminEmail?.message} hint="Будет использоваться для входа в систему">
            <Input placeholder="zavuch@school.by" {...register('adminEmail')} maxLength="128" />
          </Field>
          <Field label="Пароль завуча" type="password" error={errors.adminPassword?.message}>
            <Input placeholder="••••••••" {...register('adminPassword')} maxLength="128" />
          </Field>
          <Field label="Повторите пароль" type="password" error={errors.adminPasswordConfirm?.message}>
            <Input placeholder="••••••••" {...register('adminPasswordConfirm')} maxLength="128" />
          </Field>
        </>
      ) : null}
    </div>
  )
}

export function SchoolCreateDialog({ open, onOpenChange }) {
  const createSchool = useCreateSchool()
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createSchema), defaultValues: defaultCreate })

  useEffect(() => {
    if (!open) reset(defaultCreate)
  }, [open, reset])

  const onSubmit = async (values) => {
    try {
      const school = await createSchool.mutateAsync({
        ...values,
        bufferPercent: Number(values.bufferPercent),
        adminEmail: values.adminEmail || undefined,
        adminFullName: values.adminFullName || undefined,
        adminPassword: values.adminPassword || undefined,
      })
      toast({ title: 'Школа добавлена', description: school.name, variant: 'success' })
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось создать школу', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Новая школа"
      description="Подключите школу к платформе и назначьте завуча."
      className="sm:max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" form="school-create-form" loading={isSubmitting}>
            Добавить школу
          </Button>
        </>
      }
    >
      <form id="school-create-form" onSubmit={handleSubmit(onSubmit)}>
        <SchoolFields register={register} errors={errors} includeAdmin />
      </form>
    </Dialog>
  )
}

const editSchema = baseSchema

export function SchoolEditDialog({ open, onOpenChange, school, scope = 'school' }) {
  const updateSchool = useUpdateSchool()
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(editSchema) })

  useEffect(() => {
    if (school && open) {
      reset({
        name: school.name || '',
        city: school.city || '',
        district: school.district || '',
        address: school.address || '',
        phone: school.phone || '',
        email: school.email || '',
        mealPlan: school.mealPlan || 'fixed',
        timezone: school.timezone || 'Europe/Minsk',
        bufferPercent: school.bufferPercent ?? 10,
        attendanceDeadline: school.attendanceDeadline || '09:30',
      })
    }
  }, [school, open, reset])

  const onSubmit = async (values) => {
    try {
      await updateSchool.mutateAsync({
        schoolId: school.id,
        scope,
        payload: { ...values, bufferPercent: Number(values.bufferPercent) },
      })
      toast({ title: 'Данные школы обновлены', variant: 'success' })
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось сохранить', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Редактировать школу"
      className="sm:max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" form="school-edit-form" loading={isSubmitting}>
            Сохранить
          </Button>
        </>
      }
    >
      <form id="school-edit-form" onSubmit={handleSubmit(onSubmit)}>
        <SchoolFields register={register} errors={errors} />
      </form>
    </Dialog>
  )
}
