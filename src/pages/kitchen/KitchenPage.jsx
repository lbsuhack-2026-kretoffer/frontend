import { useState, useEffect, useCallback } from 'react'
import { Factory, Utensils, Plus, Menu } from 'lucide-react'
import { useCreateMenuItem } from '@/api/hooks'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Dialog } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { Field, Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/use-toast'

export default function KitchenPage() {
  const { toast } = useToast()
  const [kitchens, setKitchens] = useState([])
  const [selectedKitchenId, setSelectedKitchenId] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [loadingKitchens, setLoadingKitchens] = useState(false)
  const [loadingMenu, setLoadingMenu] = useState(false)

  const createMenuItem = useCreateMenuItem()

  const loadKitchens = useCallback(async () => {
    setLoadingKitchens(true)
    try {
      const res = await fetch('/api/v1/platform/kitchens', { credentials: 'include' })
      if (!res.ok) throw new Error('Не удалось загрузить список КШП')
      const data = await res.json()
      setKitchens(data)
      if (!selectedKitchenId && data.length > 0) {
        setSelectedKitchenId(data[0].id)
      }
    } catch (error) {
      toast({ title: 'Не удалось загрузить КШП', description: error.message, variant: 'error' })
    } finally {
      setLoadingKitchens(false)
    }
  }, [selectedKitchenId, toast])

  const loadMenu = useCallback(async (kitchenId) => {
    setLoadingMenu(true)
    try {
      const res = await fetch(`/api/v1/kitchens/${kitchenId}/menu/day`, { credentials: 'include' })
      if (!res.ok) throw new Error('Не удалось загрузить меню')
      const data = await res.json()
      setMenuItems(data || [])
    } catch (error) {
      toast({ title: 'Не удалось загрузить меню', description: error.message, variant: 'error' })
    } finally {
      setLoadingMenu(false)
    }
  }, [toast])

  useEffect(() => {
    loadKitchens()
  }, [loadKitchens])

  useEffect(() => {
    if (selectedKitchenId) {
      loadMenu(selectedKitchenId)
    }
  }, [selectedKitchenId, loadMenu])

  const selectedKitchen = kitchens.find((k) => k.id === selectedKitchenId)

  const submitMenuItem = async (event) => {
    event.preventDefault()
    if (!selectedKitchenId) return

    const form = new FormData(event.target)
    const name = form.get('name')
    const price = form.get('price')

    if (!name || !price) {
      toast({ title: 'Заполните все поля', variant: 'error' })
      return
    }

    try {
      await createMenuItem.mutateAsync({
        kitchenId: selectedKitchenId,
        payload: { name: String(name), price: Number(price) },
      })
      toast({ title: 'Блюдо добавлено в меню', variant: 'success' })
      event.target.reset()
      await loadMenu(selectedKitchenId)
    } catch (error) {
      toast({ title: 'Не удалось добавить блюдо', description: error.message, variant: 'error' })
    }
  }

  if (loadingKitchens) {
    return <div className="flex h-screen items-center justify-center">Загрузка КШП...</div>
  }

  return (
    <>
      <PageHeader
        eyebrow="Кабинет КШП"
        title="Управление меню комбината питания"
        description={
          selectedKitchen
            ? `КШП «${selectedKitchen.name}» · район ${selectedKitchen.district}`
            : 'Выберите комбинат питания для управления меню'
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        {/* Выбор КШП */}
        <div className="lg:col-span-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>КШП района</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {kitchens.length === 0 ? (
                <EmptyState
                  icon={Factory}
                  title="КШП не найдены"
                  description="Создайте первый комбинат питания в разделе Платформа → КШП"
                />
              ) : (
                <div className="space-y-2">
                  {kitchens.map((kitchen) => (
                    <Button
                      key={kitchen.id}
                      onClick={() => setSelectedKitchenId(kitchen.id)}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-lg border transition-colors
                        ${selectedKitchenId === kitchen.id
                          ? 'bg-brand-50 border-brand-200 text-brand-800'
                          : 'bg-surface border-line hover:bg-elevated'}
                      `}
                    >
                      <Factory className="h-4 w-4" />
                      <div>
                        <div className="font-medium text-strong">{kitchen.name}</div>
                        <div className="text-[11px] text-muted">{kitchen.district}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Меню выбранного КШП */}
        <div className="lg:col-span-8">
          {!selectedKitchen ? (
            <EmptyState
              icon={Menu}
              title="Выберите КШП"
              description="Выберите комбинат питания слева, чтобы управлять его меню"
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-strong">Меню на день</h2>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> Добавить блюдо
                </Button>
              </div>

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{selectedKitchen.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {loadingMenu ? (
                    <div className="h-64 animate-pulse rounded-xl bg-elevated" />
                  ) : menuItems.length === 0 ? (
                    <EmptyState
                      icon={Utensils}
                      title="Блюд пока нет"
                      description="Добавьте первые блюда в меню этого КШП"
                    />
                  ) : (
                    <Table>
                      <THead>
                        <TR>
                          <TH>Блюдо</TH>
                          <TH className="text-right">Цена, BYN</TH>
                          <TH className="text-right">Действия</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {menuItems.map((item) => (
                          <TR key={item.id}>
                            <TD className="font-medium text-strong">{item.name}</TD>
                            <TD className="text-right font-mono">{item.price.toFixed(2)}</TD>
                            <TD className="text-right">
                              <Button variant="ghost" size="icon-sm">
                                <Menu className="h-3.5 w-3.5" />
                              </Button>
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Добавить блюдо в меню"
        description={`Блюдо будет добавлено в меню КШП «${selectedKitchen?.name}»`}
      >
        <form onSubmit={submitMenuItem} className="grid gap-3 p-4">
          <Field label="Название блюда">
            <Input name="name" placeholder="Горячее блюдо" />
          </Field>
          <Field label="Цена, BYN">
            <Input type="number" min="0" step="0.01" name="price" placeholder="5.50" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">Добавить</Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
