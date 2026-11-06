import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreateClass, useUpdateClass } from '@/api/hooks'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Input, Select } from '@/shared/ui/input'
import { useToast } from '@/shared/ui/use-toast'
import { AGE_GROUP_LABELS } from '@/shared/lib/labels'

const schema = z.object({
  name: z.string().min(1, 'Укажите название класса').max(64, 'Название слишком длинное'),
  grade: z.coerce.number().min(1, 'Класс 1–11').max(11, 'Класс 1–11'),
  ageGroup: z.enum(['junior', 'middle', 'senior']),
  teacherId: z.string().optional(),
  // План набора учеников
  letter: z.string().min(1, 'Укажите букву класса').max(2, 'Буква — 1–2 символа'),
  studentsCount: z.coerce.number().min(1, 'От 1 ученика').max(60, 'До 60 учеников'),
  studentNames: z
    .string()
    .min(1, 'Укажите хотя бы одного ученика')
    .max(2000, 'Слишком длинный список')
    .refine(
      (val) => val.trim().split(/\s+/).filter(Boolean).filter((n) => n.length >= 2).length > 0,
      'Укажите хотя бы одного ученика с фамилией и именем',
    ),
})

function ClassForm({ formId, register, errors, teachers, onSubmit, isCreate }) {
  const namesList = React.useMemo(
    () => register('studentNames')?.value?.trim().split(/\s+/).filter(Boolean).filter((n) => n.length >= 2) || [],
    [register],
  )

  return (
    <form id={formId} onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Название класса" error={errors.name?.message}>
        <Input placeholder="6А" {...register('name')} maxLength="64" />
      </Field>
      <Field label="Параллель (1–11)" error={errors.grade?.message}>
        <Input type="number" min="1" max="11" {...register('grade')} />
      </Field>
      <Field label="Буква класса" error={errors.letter?.message} hint="Например: А, Б, В">
        <Input placeholder="А" {...register('letter')} maxLength="2" />
      </Field>
      <Field label="Возрастная группа" error={errors.ageGroup?.message}>
        <Select {...register('ageGroup')}>
          <option value="junior">{AGE_GROUP_LABELS.junior}</option>
          <option value="middle">{AGE_GROUP_LABELS.middle}</option>
          <option value="senior">{AGE_GROUP_LABELS.senior}</option>
        </Select>
      </Field>
      {isCreate && (
        <>
          <Field label="Количество учеников" error={errors.studentsCount?.message} hint="Сколько мест в классе">
            <Input type="number" min="1" max="60" {...register('studentsCount')} />
          </Field>
          <Field label="ФИО учеников (через пробел или с новой строки)" error={errors.studentNames?.message} hint="Например: Иванов Иван, Петров Петр">
            <textarea
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-strong placeholder:text-subtle transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              rows={4}
              placeholder="Иванов Иван\nПетров Петр\nСидорова Анна"
              {...register('studentNames')}
              maxLength="2000"
            />
          </Field>
          <Field label="Список учеников" hint={namesList.length ? `Добавлено: ${namesList.join(', ')}` : 'Введите ФИО выше'}>
            <p className="text-xs text-muted">{namesList.length ? namesList.join(', ') : '—'}</p>
          </Field>
        </>
      )}
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
    defaultValues: {
      name: '',
      grade: 5,
      ageGroup: 'middle',
      teacherId: '',
      letter: '',
      studentsCount: 25,
      studentNames: '',
    },
  })

  useEffect(() => {
    if (!open) reset({ name: '', grade: 5, ageGroup: 'middle', teacherId: '', letter: '', studentsCount: 25, studentNames: '' })
  }, [open, reset])

  const onSubmit = async (values) => {
    try {
      await createClass.mutateAsync({
        grade: Number(values.grade),
        letter: values.letter.trim().toUpperCase(),
        studentsCount: Number(values.studentsCount),
        studentNames: values.studentNames.split(/\s+/).filter((n) => n.length >= 2),
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
        isCreate
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
        letter: cls.name.slice(-1) || '',
        studentsCount: cls.studentsCount,
        studentNames: '',
      })
    }
  }, [cls, open, reset])

  const onSubmit = async (values) => {
    try {
      await updateClass.mutateAsync({
        classId: cls.id,
        payload: {
          name: values.name,
          grade: Number(values.grade),
          ageGroup: values.ageGroup,
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
