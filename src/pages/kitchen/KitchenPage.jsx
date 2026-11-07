import { useState, useEffect, useCallback } from 'react'
import {
  Factory,
  Utensils,
  Plus,
  Menu,
  Link,
  Unlink,
  Trash2,
  ChevronRight,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import {
  useCreateKitchen,
  useCreateMenuItem,
  useDeleteKitchen,
  useDeleteMenuItem,
  useKitchenSchools,
  useSetSchoolKitchen,
} from '@/api/hooks'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { ConfirmDialog, Dialog } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { Field, Input, Select } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { useToast } from '@/shared/ui/use-toast'
import { formatMoney } from '@/shared/lib/format'

export default function KitchenPage() {
  const { toast } = useToast()
  const [kitchens, setKitchens] = useState([])
  const [selectedKitchenId, setSelectedKitchenId] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [createKitchenOpen, setCreateKitchenOpen] = useState(false)
  const [attachOpen, setAttachOpen] = useState(false)
  const [loadingKitchens, setLoadingKitchens] = useState(false)
  const [loadingMenu, setLoadingMenu] = useState(false)

  const createMenuItem = useCreateMenuItem()
  const deleteMenuItem = useDeleteMenuItem()
  const createKitchen = useCreateKitchen()
  const deleteKitchen = useDeleteKitchen()
  const setSchoolKitchen = useSetSchoolKitchen()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [kitchenToDelete, setKitchenToDelete] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [itemDeleteOpen, setItemDeleteOpen] = useState(false)

  const loadKitchens = useCallback(async () => {
    setLoadingKitchens(true)
    try {
      const res = await fetch('/api/v1/kitchen/kitchens', { credentials: 'include', cache: 'no-store' })
      if (!res.ok) throw new Error('Не удалось загрузить список КШП')
      const data = await res.json()
      setKitchens(data)
    } catch (error) {
      toast({ title: 'Не удалось загрузить КШП', description: error.message, variant: 'error' })
    } finally {
      setLoadingKitchens(false)
    }
  }, [toast])

  const loadMenu = useCallback(async (kitchenId) => {
    if (!kitchenId) return
    setLoadingMenu(true)
    try {
      const res = await fetch(`/api/v1/kitchen/kitchens/${kitchenId}/menu`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`Ошибка ${res.status}: не удалось загрузить меню`)
      const data = await res.json()
      setMenuItems(data || [])
    } catch (error) {
      toast({ title: 'Не удалось загрузить меню', description: error.message, variant: 'error' })
    } finally {
      setLoadingMenu(false)
    }
  }, [toast])

  const { data: schoolsData } = useKitchenSchools(selectedKitchenId)

  useEffect(() => {
    loadKitchens()
  }, [loadKitchens])

  // Автовыбор первого КШП после загрузки
  useEffect(() => {
    if (!selectedKitchenId && kitchens.length > 0) {
      setSelectedKitchenId(kitchens[0].id)
    }
  }, [kitchens, selectedKitchenId])

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

  const handleDeleteMenuItem = async () => {
    if (!itemToDelete || !selectedKitchenId) return
    try {
      await deleteMenuItem.mutateAsync({ kitchenId: selectedKitchenId, itemId: itemToDelete.id })
      toast({ title: 'Блюдо удалено из меню', variant: 'success' })
      setItemDeleteOpen(false)
      setItemToDelete(null)
      await loadMenu(selectedKitchenId)
    } catch (error) {
      toast({ title: 'Не удалось удалить блюдо', description: error.message, variant: 'error' })
    }
  }

  const submitKitchen = async (event) => {
    event.preventDefault()
    const form = new FormData(event.target)
    const name = form.get('name')
    const district = form.get('district')
    const fullName = form.get('fullName')
    const email = form.get('email')
    const password = form.get('password')

    if (!name || !district || !fullName || !email || !password) {
      toast({ title: 'Заполните все поля', variant: 'error' })
      return
    }

    try {
      await createKitchen.mutateAsync({
        name: String(name),
        district: String(district),
        fullName: String(fullName),
        email: String(email),
        password: String(password),
      })
      toast({ title: 'КШП создано', variant: 'success' })
      event.target.reset()
      setCreateKitchenOpen(false)
      await loadKitchens()
    } catch (error) {
      toast({ title: 'Не удалось создать КШП', description: error.message, variant: 'error' })
    }
  }

  const attachSchool = async (schoolId) => {
    try {
      await setSchoolKitchen.mutateAsync({ schoolId, kitchenId: selectedKitchenId })
      toast({ title: 'Школа привязана к КШП', variant: 'success' })
      setAttachOpen(false)
    } catch (error) {
      toast({ title: 'Не удалось привязать школу', description: error.message, variant: 'error' })
    }
  }

  const detachSchool = async (schoolId) => {
    try {
      await setSchoolKitchen.mutateAsync({ schoolId, kitchenId: null })
      toast({ title: 'Школа отвязана от КШП', variant: 'success' })
    } catch (error) {
      toast({ title: 'Не удалось отвязать школу', description: error.message, variant: 'error' })
    }
  }

  const handleDeleteKitchen = async () => {
    if (!kitchenToDelete) return
    try {
      await deleteKitchen.mutateAsync(kitchenToDelete.id)
      toast({ title: 'КШП удалено', variant: 'success' })
      setDeleteOpen(false)
      setKitchenToDelete(null)
      await loadKitchens()
      if (selectedKitchenId === kitchenToDelete.id) {
        setSelectedKitchenId(null)
      }
    } catch (error) {
      toast({ title: 'Не удалось удалить КШП', description: error.message, variant: 'error' })
    }
  }

  if (loadingKitchens) {
    return <div className="flex h-screen items-center justify-center">Загрузка КШП...</div>
  }

  // Если КШП не выбран — показываем пустое состояние
  if (!selectedKitchen) {
    return (
      <>
        <PageHeader
          eyebrow="Кабинет КШП"
          title="Управление меню комбината питания"
          description="Выберите комбинат питания для управления меню и школами"
          actions={
            <Button onClick={() => setCreateKitchenOpen(true)}>
              <Plus className="h-4 w-4" /> Создать КШП
            </Button>
          }
        />
        <div className="mt-6 flex items-center justify-center">
          <EmptyState
            icon={Factory}
            title="КШП не выбраны"
            description="Выберите комбинат питания слева или создайте первый"
            action={
              <Button onClick={() => setCreateKitchenOpen(true)}>
                <Plus className="h-4 w-4" /> Создать КШП
              </Button>
            }
          />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Кабинет КШП"
        title="Управление меню комбината питания"
        description={`КШП «${selectedKitchen.name}» · район ${selectedKitchen.district}`}
        actions={
          <Button onClick={() => setCreateKitchenOpen(true)}>
            <Plus className="h-4 w-4" /> Создать КШП
          </Button>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
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
                  description="Создайте первый комбинат питания"
                />
              ) : (
                <div className="space-y-2">
                  {kitchens.map((kitchen) => (
                    <div
                      key={kitchen.id}
                      className="flex items-center gap-2"
                      onClick={() => setSelectedKitchenId(kitchen.id)}
                    >
                      <Button
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedKitchenId(kitchen.id)
                        }}
                        className={`
                          flex-1 flex items-center gap-3 p-3 rounded-lg border transition-colors
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
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(event) => {
                          event.stopPropagation()
                          setKitchenToDelete(kitchen)
                          setDeleteOpen(true)
                        }}
                        aria-label="Удалить КШП"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Детали КШП */}
        <div className="lg:col-span-8">
          {/* Школы КШП */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Школы КШП: {selectedKitchen.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {!schoolsData ? (
                <div className="h-40 animate-pulse rounded-xl bg-elevated" />
              ) : schoolsData.length === 0 ? (
                <EmptyState
                  icon={Link}
                  title="Школ пока нет"
                  description="Привяжите школы этого района к КШП"
                  action={
                    <Button onClick={() => setAttachOpen(true)}>
                      <Link className="h-3.5 w-3.5" />
                      Привязать первую школу
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-2">
                  {schoolsData.map((school) => (
                    <div
                      key={school.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-line bg-surface hover:bg-elevated transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 p-1.5 rounded-lg bg-blue-50 text-blue-600">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-strong">{school.name}</div>
                          <div className="text-[11px] text-muted">
                            {school.city} · {school.studentsCount} учеников
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => detachSchool(school.id)}
                        aria-label="Отвязать школу"
                      >
                        <Unlink className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {schoolsData && schoolsData.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttachOpen(true)}
                  className="mt-3"
                >
                  <Link className="h-3.5 w-3.5 mr-1.5" />
                  Привязать ещё школу
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Меню выбранного КШП */}
          <Card className="overflow-hidden mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Меню на день</CardTitle>
                  <p className="text-xs text-muted">
                    Блюда комбината «{selectedKitchen.name}»
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" /> Добавить блюдо
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedKitchenId(null)}>
                    Закрыть
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingMenu ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Clock className="h-6 w-6 animate-spin text-brand-500" />
                    <p className="text-sm text-muted">Загрузка меню...</p>
                  </div>
                </div>
              ) : menuItems.length === 0 ? (
                <EmptyState
                  icon={Utensils}
                  title="Блюд пока нет"
                  description="Добавьте первые блюда в меню этого КШП"
                />
              ) : (
                <div className="space-y-2">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-line bg-white hover:bg-elevated transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0 p-1.5 rounded-lg bg-amber-50 text-amber-600">
                          <Utensils className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-strong">{item.name}</div>
                          <div className="text-[11px] text-muted">{formatMoney(item.price)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            setItemToDelete(item)
                            setItemDeleteOpen(true)
                          }}
                          aria-label="Удалить блюдо"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Добавить блюдо в меню"
        description={`Блюдо будет добавлено в меню КШП «${selectedKitchen.name}»`}
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

      <Dialog
        open={createKitchenOpen}
        onOpenChange={setCreateKitchenOpen}
        title="Создать КШП"
        description="Создайте комбинат питания для района"
      >
        <form onSubmit={submitKitchen} className="grid gap-3 p-4">
          <Field label="Название КШП" className="sm:col-span-2">
            <Input name="name" placeholder="КШП Центральный" />
          </Field>
          <Field label="Район">
            <Input name="district" placeholder="Центральный район" />
          </Field>
          <Field label="ФИО сотрудника КШП" className="sm:col-span-2">
            <Input name="fullName" placeholder="Иван Петров" />
          </Field>
          <Field label="Логин общего аккаунта КШП (e-mail)" className="sm:col-span-2">
            <Input type="email" name="email" placeholder="kitchen@school.by" />
          </Field>
          <Field label="Пароль общего аккаунта КШП" className="sm:col-span-2">
            <Input type="password" name="password" placeholder="••••••••" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateKitchenOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">Создать</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => !open && setDeleteOpen(false)}
        title="Удалить КШП?"
        description={
          kitchenToDelete
            ? `Комбинат питания «${kitchenToDelete.name}» и все привязанные к нему школы будут удалены.`
            : ''
        }
        confirmLabel="Удалить"
        loading={deleteKitchen.isPending}
        onConfirm={handleDeleteKitchen}
      />

      <ConfirmDialog
        open={itemDeleteOpen}
        onOpenChange={(open) => !open && setItemDeleteOpen(false)}
        title="Удалить блюдо?"
        description={
          itemToDelete
            ? `Блюдо «${itemToDelete.name}» будет удалено из меню.`
            : ''
        }
        confirmLabel="Удалить"
        loading={deleteMenuItem.isPending}
        onConfirm={handleDeleteMenuItem}
      />
      <Dialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        title="Привязать школу к КШП"
        description={`Выберите школу для привязки к «${selectedKitchen.name}»`}
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          const form = new FormData(e.target)
          const schoolId = form.get('schoolId')
          if (schoolId) attachSchool(schoolId)
        }} className="grid gap-3 p-4">
          <Field label="Школа" className="sm:col-span-2">
            <Select>
              <option value="">Выберите школу</option>
              {schoolsData?.filter((s) => !s.kitchenId).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.city}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAttachOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">Привязать</Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
