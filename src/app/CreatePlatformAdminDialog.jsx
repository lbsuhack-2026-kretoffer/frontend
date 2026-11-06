import { useState } from 'react'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { useCreatePlatformAdmin } from '@/api/hooks'

export function CreatePlatformAdminDialog({ open, onOpenChange }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
  })

  const createPlatformAdmin = useCreatePlatformAdmin()

  const submit = async (event) => {
    event.preventDefault()
    if (!form.fullName || !form.email || !form.password) {
      toast({ title: 'Заполните все поля', variant: 'error' })
      return
    }
    try {
      await createPlatformAdmin.mutateAsync({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      })
      toast({ title: 'Суперадмин создан', variant: 'success' })
      setForm({ fullName: '', email: '', password: '' })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Не удалось создать суперадмина',
        description: error.message,
        variant: 'error',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Создать суперадмина">
      <form onSubmit={submit} className="grid gap-3 p-4">
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
            placeholder="admin@school.by"
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
