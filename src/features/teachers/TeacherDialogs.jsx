import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useInviteTeacher } from '@/api/hooks'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Input, Select } from '@/shared/ui/input'
import { useToast } from '@/shared/ui/use-toast'

const schema = z.object({
  fullName: z.string().min(3, 'Укажите ФИО'),
  email: z.string().email('Некорректный e-mail'),
  position: z.string().min(2, 'Укажите должность'),
})

export function InviteTeacherDialog({ open, onOpenChange, schoolId }) {
  const invite = useInviteTeacher(schoolId)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', position: 'Учитель' },
  })

  useEffect(() => {
    if (!open) reset({ fullName: '', email: '', position: 'Учитель' })
  }, [open, reset])

  const onSubmit = async (values) => {
    try {
      await invite.mutateAsync(values)
      toast({ title: 'Учитель добавлен', description: values.fullName, variant: 'success' })
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось добавить учителя', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Добавить учителя"
      description="Учитель получит доступ к школе и сможет отмечать закреплённые классы."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" form="invite-teacher-form" loading={isSubmitting}>
            Добавить
          </Button>
        </>
      }
    >
      <form id="invite-teacher-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
        <Field label="ФИО" error={errors.fullName?.message}>
          <Input placeholder="Марина Соловьёва" {...register('fullName')} />
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          <Input type="email" placeholder="teacher@school.by" {...register('email')} />
        </Field>
        <Field label="Должность" error={errors.position?.message}>
          <Input placeholder="Учитель начальных классов" {...register('position')} />
        </Field>
      </form>
    </Dialog>
  )
}

export function AssignClassDialog({ open, onOpenChange, teacher, classes, onAssign, loading }) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Назначить класс"
      description={teacher ? `Выберите класс для ${teacher.fullName}` : ''}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" form="assign-class-form" loading={loading}>
            Назначить
          </Button>
        </>
      }
    >
      <form
        id="assign-class-form"
        onSubmit={(event) => {
          event.preventDefault()
          const classId = new FormData(event.currentTarget).get('classId')
          if (classId) onAssign(classId)
        }}
        className="grid gap-3"
      >
        <Field label="Класс">
          <Select name="classId" required>
            <option value="">Выберите класс</option>
            {(classes || []).map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
                {cls.teacherNames?.length ? ` · ${cls.teacherNames.join(', ')}` : ''}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Dialog>
  )
}
