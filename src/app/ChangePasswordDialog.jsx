import { useState } from 'react'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { useChangePassword } from '@/api/hooks'
import { useToast } from '@/shared/ui/use-toast'

export function ChangePasswordDialog({ open, onOpenChange }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  })
  const changePassword = useChangePassword()
  const { toast } = useToast()

  const submit = async (event) => {
    event.preventDefault()
    if (!form.currentPassword || !form.newPassword || !form.newPasswordConfirm) {
      toast({ title: 'Заполните все поля', variant: 'error' })
      return
    }
    if (form.newPassword !== form.newPasswordConfirm) {
      toast({ title: 'Новые пароли не совпадают', variant: 'error' })
      return
    }
    try {
      await changePassword.mutateAsync({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      toast({ title: 'Пароль изменён', variant: 'success' })
      setForm({ currentPassword: '', newPassword: '', newPasswordConfirm: '' })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Не удалось сменить пароль',
        description: error.message,
        variant: 'error',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Сменить пароль">
      <form onSubmit={submit} className="grid gap-3 p-4">
        <Field label="Текущий пароль" type="password">
          <Input
            value={form.currentPassword}
            onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
            placeholder="••••••••"
          />
        </Field>
        <Field label="Новый пароль" type="password">
          <Input
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            placeholder="••••••••"
          />
        </Field>
        <Field label="Повторите новый пароль" type="password">
          <Input
            value={form.newPasswordConfirm}
            onChange={(event) => setForm({ ...form, newPasswordConfirm: event.target.value })}
            placeholder="••••••••"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" loading={changePassword.isPending}>
            Сохранить
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
