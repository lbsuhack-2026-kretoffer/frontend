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
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email('Некорректный e-mail'), z.literal('')]).optional(),
  mealPlan: z.enum(['fixed', 'canteen']),
  timezone: z.string().min(1),
  bufferPercent: z.coerce.number().min(0, 'Минимум 0%').max(30, 'Максимум 30%'),
  attendanceDeadline: z.string().min(1),
})

const createSchema = baseSchema.extend({
  adminFullName: z.string().optional(),
  adminEmail: z.union([z.string().email('Некорректный e-mail'), z.literal('')]).optional(),
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
}

function SchoolFields({ register, errors, includeAdmin = false }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Название школы" error={errors.name?.message} className="sm:col-span-2">
        <Input placeholder="Гимназия №12" {...register('name')} />
      </Field>
      <Field label="Город" error={errors.city?.message}>
        <Input placeholder="Минск" {...register('city')} />
      </Field>
      <Field label="Адрес" error={errors.address?.message}>
        <Input placeholder="ул. Кропоткина, 12" {...register('address')} />
      </Field>
      <Field label="Телефон" error={errors.phone?.message}>
        <Input placeholder="+375 17 ..." {...register('phone')} />
      </Field>
      <Field label="E-mail школы" error={errors.email?.message}>
        <Input placeholder="school@edu.by" {...register('email')} />
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
            <Input placeholder="Иван Петров" {...register('adminFullName')} />
          </Field>
          <Field label="E-mail завуча" error={errors.adminEmail?.message} hint="Приглашение и доступ к школе">
            <Input placeholder="zavuch@school.by" {...register('adminEmail')} />
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
