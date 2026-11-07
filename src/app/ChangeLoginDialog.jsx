import { useState } from 'react'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { useChangeLogin } from '@/api/hooks'
import { useToast } from '@/shared/ui/use-toast'

export function ChangeLoginDialog({ open, onOpenChange }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newEmail: '',
  })
  const changeLogin = useChangeLogin()
  const { toast } = useToast()

  const submit = async (event) => {
    event.preventDefault()
    if (!form.currentPassword || !form.newEmail) {
      toast({ title: 'Заполните все поля', variant: 'error' })
      return
    }
    try {
      const user = await changeLogin.mutateAsync({
        currentPassword: form.currentPassword,
        newEmail: form.newEmail.trim(),
      })
      toast({
        title: 'Логин изменён',
        description: `Новый вход: ${user.email}`,
        variant: 'success',
      })
      setForm({ currentPassword: '', newEmail: '' })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Не удалось сменить логин',
        description: error.message,
        variant: 'error',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Сменить логин (e-mail)">
      <form onSubmit={submit} className="grid gap-3 p-4">
        <Field label="Текущий пароль" type="password">
          <Input
            value={form.currentPassword}
            onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
            placeholder="••••••••"
          />
        </Field>
        <Field label="Новый e-mail (логин)" type="email">
          <Input
            value={form.newEmail}
            onChange={(event) => setForm({ ...form, newEmail: event.target.value })}
            placeholder="admin@school.by"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" loading={changeLogin.isPending}>
            Сохранить
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
