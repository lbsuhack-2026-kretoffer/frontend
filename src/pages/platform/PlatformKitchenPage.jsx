import { useState, useEffect, useCallback } from 'react'
import { Factory, Plus, Utensils } from 'lucide-react'
import { useCreateKitchen, useCreateMenuItem } from '@/api/hooks'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Dialog } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { Field, Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/use-toast'

function CreateKitchenDialog({ open, onOpenChange }) {
  const [name, setName] = useState('')
  const [district, setDistrict] = useState('')
  const { toast } = useToast()
  const createKitchen = useCreateKitchen()

  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Укажите название КШП', variant: 'error' })
      return
    }
    if (!district.trim()) {
      toast({ title: 'Укажите район', variant: 'error' })
      return
    }
    try {
      await createKitchen.mutateAsync({ name: name.trim(), district: district.trim() })
      toast({ title: 'КШП создано', variant: 'success' })
      setName('')
      setDistrict('')
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось создать КШП', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Новый КШП">
      <form onSubmit={submit} className="grid gap-3 p-4">
        <Field label="Название КШП" className="sm:col-span-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="КШП Центральный" />
        </Field>
        <Field label="Район">
          <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Центральный район" />
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

function MenuItemDialog({ open, onOpenChange, kitchenId }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const { toast } = useToast()
  const createMenuItem = useCreateMenuItem()

  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Укажите название блюда', variant: 'error' })
      return
    }
    if (!price.trim() || isNaN(Number(price))) {
      toast({ title: 'Укажите корректную цену', variant: 'error' })
      return
    }
    try {
      await createMenuItem.mutateAsync({ kitchenId, payload: { name: name.trim(), price: Number(price) } })
      toast({ title: 'Блюдо добавлено', variant: 'success' })
      setName('')
      setPrice('')
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось добавить блюдо', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Добавить блюдо в меню">
      <form onSubmit={submit} className="grid gap-3 p-4">
        <Field label="Название блюда">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Горячее" />
        </Field>
        <Field label="Цена, BYN">
          <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit">Добавить</Button>
        </div>
      </form>
    </Dialog>
  )
}

export default function PlatformKitchenPage() {
  const [kitchens, setKitchens] = useState([])
  const [selectedKitchen, setSelectedKitchen] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadKitchens = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/platform/kitchens', { credentials: 'include' })
      if (!res.ok) throw new Error('Не удалось загрузить КШП')
      const data = await res.json()
      setKitchens(data)
    } catch (error) {
      toast({ title: 'Не удалось загрузить КШП', description: error.message, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMenu = async (kitchenId) => {
    try {
      const res = await fetch(`/api/v1/platform/kitchens/${kitchenId}/menu/day`, { credentials: 'include' })
      if (!res.ok) throw new Error('Не удалось загрузить меню')
      const data = await res.json()
      setMenuItems(data)
    } catch (error) {
      toast({ title: 'Не удалось загрузить меню', description: error.message, variant: 'error' })
    }
  }

  useEffect(() => {
    loadKitchens()
  }, [])

  return (
    <>
      <PageHeader
        eyebrow="Платформа"
        title="КШП / комбинат школьного питания"
        description="Управление комбинатами питания и меню с ценами для школ вашего района"
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Factory className="h-4 w-4" />
          Создать КШП
        </Button>
      </PageHeader>

      <div className="mt-6 grid gap-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Список КШП</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-64 animate-pulse rounded-xl bg-elevated" />
            ) : kitchens.length === 0 ? (
              <EmptyState
                icon={Factory}
                title="КШП пока нет"
                description="Создайте первый комбинат питания"
                action={
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Создать
                  </Button>
                }
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Название</TH>
                    <TH>Район</TH>
                    <TH>Блюд в меню</TH>
                    <TH className="text-right">Действия</TH>
                  </TR>
                </THead>
                <TBody>
                  {kitchens.map((kitchen) => (
                    <TR key={kitchen.id}>
                      <TD className="font-medium text-strong">{kitchen.name}</TD>
                      <TD>{kitchen.district}</TD>
                      <TD>{menuItems.filter(i => i.kitchen_id === kitchen.id).length}</TD>
                      <TD>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedKitchen(kitchen)
                            setMenuOpen(true)
                            loadMenu(kitchen.id)
                          }}
                        >
                          <Utensils className="h-3.5 w-3.5" />
                          Меню
                        </Button>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {selectedKitchen && (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Меню КШП: {selectedKitchen.name}</CardTitle>
              <Button onClick={() => setMenuOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Добавить блюдо
              </Button>
              <Button variant="outline" onClick={() => setMenuOpen(false)}>
                Закрыть
              </Button>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="h-64 animate-pulse rounded-xl bg-elevated" />
              ) : menuItems.length === 0 ? (
                <EmptyState icon={Utensils} title="Блюд пока нет" description="Добавьте первое блюдо в меню" />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Блюдо</TH>
                      <TH>Цена, BYN</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {menuItems.map((item) => (
                      <TR key={item.id}>
                        <TD>{item.name}</TD>
                        <TD>{item.price.toFixed(2)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <CreateKitchenDialog open={createOpen} onOpenChange={setCreateOpen} />
      <MenuItemDialog open={menuOpen} onOpenChange={setMenuOpen} kitchenId={selectedKitchen?.id} />
    </>
  )
}
