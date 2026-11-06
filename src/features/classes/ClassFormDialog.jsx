import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreateClass, useUpdateClass } from '@/api/hooks'
import { ageGroupForGrade } from '@/shared/lib/labels'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Input, Select } from '@/shared/ui/input'
import { useToast } from '@/shared/ui/use-toast'
import { AGE_GROUP_LABELS } from '@/shared/lib/labels'

const schema = z.object({
  name: z.string().min(1, 'Укажите название класса'),
  grade: z.coerce.number().min(1, '1–11').max(11, '1–11'),
  ageGroup: z.enum(['junior', 'middle', 'senior']),
  teacherId: z.string().optional(),
})

function ClassForm({ formId, register, errors, teachers, onSubmit }) {
  return (
    <form id={formId} onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Название класса" error={errors.name?.message}>
        <Input placeholder="6А" {...register('name')} />
      </Field>
      <Field label="Параллель" error={errors.grade?.message}>
        <Input type="number" min="1" max="11" {...register('grade')} />
      </Field>
      <Field label="Возрастная группа" error={errors.ageGroup?.message}>
        <Select {...register('ageGroup')}>
          <option value="junior">{AGE_GROUP_LABELS.junior}</option>
          <option value="middle">{AGE_GROUP_LABELS.middle}</option>
          <option value="senior">{AGE_GROUP_LABELS.senior}</option>
        </Select>
      </Field>
      <Field label="Учитель" error={errors.teacherId?.message} hint="Можно назначить позже">
        <Select {...register('teacherId')}>
          <option value="">Не назначен</option>
          {(teachers || []).map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.fullName}
            </option>
          ))}
        </Select>
      </Field>
    </form>
  )
}

export function ClassCreateDialog({ open, onOpenChange, schoolId, teachers }) {
  const createClass = useCreateClass(schoolId)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', grade: 5, ageGroup: 'middle', teacherId: '' },
  })

  useEffect(() => {
    if (!open) reset({ name: '', grade: 5, ageGroup: 'middle', teacherId: '' })
  }, [open, reset])

  const onSubmit = async (values) => {
    try {
      await createClass.mutateAsync({
        ...values,
        grade: Number(values.grade),
        teacherId: values.teacherId || null,
        ageGroup: values.ageGroup || ageGroupForGrade(Number(values.grade)),
      })
      toast({ title: 'Класс создан', description: values.name, variant: 'success' })
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось создать класс', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Новый класс"
      description="Класс появится в списке школы и станет доступен для отметок."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" form="class-create-form" loading={isSubmitting}>
            Создать
          </Button>
        </>
      }
    >
      <ClassForm
        formId="class-create-form"
        register={register}
        errors={errors}
        teachers={teachers}
        onSubmit={handleSubmit(onSubmit)}
      />
    </Dialog>
  )
}

export function ClassEditDialog({ open, onOpenChange, cls, teachers }) {
  const updateClass = useUpdateClass()
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (cls && open) {
      reset({
        name: cls.name,
        grade: cls.grade,
        ageGroup: cls.ageGroup,
        teacherId: cls.teacherIds?.[0] || '',
      })
    }
  }, [cls, open, reset])

  const onSubmit = async (values) => {
    try {
      await updateClass.mutateAsync({
        classId: cls.id,
        payload: {
          ...values,
          grade: Number(values.grade),
          teacherId: values.teacherId || null,
        },
      })
      toast({ title: 'Класс обновлён', variant: 'success' })
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось сохранить', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Редактировать класс"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" form="class-edit-form" loading={isSubmitting}>
            Сохранить
          </Button>
        </>
      }
    >
      <ClassForm
        formId="class-edit-form"
        register={register}
        errors={errors}
        teachers={teachers}
        onSubmit={handleSubmit(onSubmit)}
      />
    </Dialog>
  )
}
