import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAddStudent } from '@/api/hooks'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Input, Select } from '@/shared/ui/input'
import { useToast } from '@/shared/ui/use-toast'
import { MEAL_STATUS_LABELS } from '@/shared/lib/labels'

const schema = z.object({
  fullName: z.string().min(3, 'Укажите фамилию и имя'),
  mealStatus: z.enum(['regular', 'opt_out']),
})

export function AddStudentDialog({ open, onOpenChange, classId }) {
  const addStudent = useAddStudent(classId)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', mealStatus: 'regular' },
  })

  useEffect(() => {
    if (!open) reset({ fullName: '', mealStatus: 'regular' })
  }, [open, reset])

  const onSubmit = async (values) => {
    try {
      await addStudent.mutateAsync(values)
      toast({ title: 'Ученик добавлен', description: values.fullName, variant: 'success' })
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось добавить ученика', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Новый ученик"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" form="add-student-form" loading={isSubmitting}>
            Добавить
          </Button>
        </>
      }
    >
      <form id="add-student-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
        <Field label="ФИО" error={errors.fullName?.message}>
          <Input placeholder="Иванов Иван Иванович" {...register('fullName')} maxLength="256" />
        </Field>
        <Field label="Питание" error={errors.mealStatus?.message}>
          <Select {...register('mealStatus')}>
            <option value="regular">{MEAL_STATUS_LABELS.regular}</option>
            <option value="optOut">{MEAL_STATUS_LABELS.optOut}</option>
          </Select>
        </Field>
      </form>
    </Dialog>
  )
}
