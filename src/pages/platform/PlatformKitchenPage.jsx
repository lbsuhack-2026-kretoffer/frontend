import { useState } from 'react'
import { Factory, Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Dialog } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { Field, Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { useToast } from '@/shared/ui/use-toast'

function CreateKitchenDialog({ open, onOpenChange }) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const { toast } = useToast()

  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Укажите название КШП', variant: 'error' })
      return
    }
    if (!city.trim()) {
      toast({ title: 'Укажите город', variant: 'error' })
      return
    }
    if (!address.trim()) {
      toast({ title: 'Укажите адрес', variant: 'error' })
      return
    }
    try {
      toast({ title: 'КШП создано', description: name, variant: 'success' })
      setName('')
      setCity('')
      setAddress('')
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось создать КШП', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Новый комбинат школьного питания"
      description="КШП создаётся отдельно от школ и обслуживает несколько учреждений."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" form="create-kitchen-form">
            Создать
          </Button>
        </>
      }
    >
      <form id="create-kitchen-form" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Название КШП" className="sm:col-span-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="КШП Центральный район" />
        </Field>
        <Field label="Город">
          <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Минск" />
        </Field>
        <Field label="Адрес">
          <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="ул. Независимости, 100" />
        </Field>
      </form>
    </Dialog>
  )
}

export default function PlatformKitchenPage() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <PageHeader
        eyebrow="Платформа"
        title="КШП / комбинат школьного питания"
        description="Комбинаты школьного питания создаются отдельно от школ и обслуживают несколько учреждений."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Создать КШП
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Список КШП</CardTitle>
          <p className="mt-1 text-xs text-muted">Комбинаты школьного питания</p>
        </CardHeader>
        <CardContent className="pt-2">
          <EmptyState
            icon={Factory}
            title="КШП пока нет"
            description="Создайте первый комбинат школьного питания."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Создать КШП
              </Button>
            }
          />
        </CardContent>
      </Card>

      <CreateKitchenDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
