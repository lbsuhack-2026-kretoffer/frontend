import { useState } from 'react'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Input, Select } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { useToast } from '@/shared/ui/use-toast'
import { usePlatformSchools, useAssignSchoolAdmin } from '@/api/hooks'

export function CreateAdminDialog({ open, onOpenChange }) {
  const schoolsQuery = usePlatformSchools({ pageSize: 50 })
  const createSchoolAdmin = useAssignSchoolAdmin()
  const { toast } = useToast()

  const [form, setForm] = useState({
    schoolId: '',
    fullName: '',
    email: '',
    password: '',
  })

  const schools = schoolsQuery.data?.items || []

  const submit = async (event) => {
    event.preventDefault()
    if (!form.schoolId || !form.fullName || !form.email || !form.password) {
      toast({ title: 'Заполните все поля', variant: 'error' })
      return
    }
    try {
      await createSchoolAdmin.mutateAsync({
        schoolId: form.schoolId,
        payload: {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
        },
      })
      toast({ title: 'Администратор школы создан', variant: 'success' })
      setForm({ schoolId: '', fullName: '', email: '', password: '' })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Не удалось создать администратора',
        description: error.message,
        variant: 'error',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Создать админа школы">
      <form onSubmit={submit} className="grid gap-3 p-4">
        <Field label="Школа">
          <Select
            value={form.schoolId}
            onChange={(event) => setForm({ ...form, schoolId: event.target.value })}
          >
            <option value="">Выберите школу</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="ФИО">
          <Input
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            placeholder="Иван Петров"
          />
        </Field>
        <Field label="E-mail (логин)">
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="zavuch@school.by"
          />
        </Field>
        <Field label="Пароль" type="password">
          <Input
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="••••••••"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit">Создать</Button>
        </div>
      </form>
    </Dialog>
  )
}
