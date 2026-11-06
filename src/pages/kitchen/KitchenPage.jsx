import { useState, useEffect, useCallback } from 'react'
import { Factory, Utensils, Plus, Menu, UserPlus, Link, Unlink } from 'lucide-react'
import { useCreateKitchen, useCreateKitchenUser, useCreateMenuItem, useKitchenSchools, useSetSchoolKitchen } from '@/api/hooks'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Dialog } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { Field, Input, Select } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/use-toast'

export default function KitchenPage() {
  const { toast } = useToast()
  const [kitchens, setKitchens] = useState([])
  const [selectedKitchenId, setSelectedKitchenId] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [createKitchenOpen, setCreateKitchenOpen] = useState(false)
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [attachOpen, setAttachOpen] = useState(false)
  const [loadingKitchens, setLoadingKitchens] = useState(false)
  const [loadingMenu, setLoadingMenu] = useState(false)

  const createMenuItem = useCreateMenuItem()
  const createKitchen = useCreateKitchen()
  const createKitchenUser = useCreateKitchenUser()
  const setSchoolKitchen = useSetSchoolKitchen()

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

  useEffect(() => {
    if (schoolsData) {
      // schoolsData уже приходит отфильтрованным по kitchenId бэкендом
    }
  }, [schoolsData])

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

  const submitKitchen = async (event) => {
    event.preventDefault()
    const form = new FormData(event.target)
    const name = form.get('name')
    const district = form.get('district')

    if (!name || !district) {
      toast({ title: 'Заполните все поля', variant: 'error' })
      return
    }

    try {
      await createKitchen.mutateAsync({ name: String(name), district: String(district) })
      toast({ title: 'КШП создано', variant: 'success' })
      event.target.reset()
      setCreateKitchenOpen(false)
      await loadKitchens()
    } catch (error) {
      toast({ title: 'Не удалось создать КШП', description: error.message, variant: 'error' })
    }
  }

  const submitKitchenUser = async (event) => {
    event.preventDefault()
    if (!selectedKitchenId) return

    const form = new FormData(event.target)
    const email = form.get('email')
    const fullName = form.get('fullName')
    const password = form.get('password')

    if (!email || !fullName || !password) {
      toast({ title: 'Заполните все поля', variant: 'error' })
      return
    }

    try {
      await createKitchenUser.mutateAsync({
        kitchenId: selectedKitchenId,
        payload: {
          email: String(email),
          fullName: String(fullName),
          password: String(password),
        },
      })
      toast({ title: 'Пользователь КШП создан', variant: 'success' })
      event.target.reset()
      setCreateUserOpen(false)
    } catch (error) {
      toast({ title: 'Не удалось создать пользователя', description: error.message, variant: 'error' })
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
        actions={
          <>
            <Button onClick={() => setCreateKitchenOpen(true)}>
              <Plus className="h-4 w-4" /> Создать КШП
            </Button>
            {selectedKitchen && (
              <Button onClick={() => setCreateUserOpen(true)}>
                <UserPlus className="h-4 w-4" /> Создать пользователя КШП
              </Button>
            )}
          </>
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
                  description="Создайте первый комбинат питания"
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

        {/* Детали КШП */}
        <div className="lg:col-span-8">
          {!selectedKitchen ? (
            <EmptyState
              icon={Menu}
              title="Выберите КШП"
              description="Выберите комбинат питания слева, чтобы управлять его меню и школами"
            />
          ) : (
            <>
              {/* Школы КШП */}
              <Card className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Школы КШП: {selectedKitchen.name}</CardTitle>
                    <Button onClick={() => setAttachOpen(true)}>
                      <Link className="h-3.5 w-3.5" />
                      Привязать школу
                    </Button>
                  </div>
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
                    <Table>
                      <THead>
                        <TR>
                          <TH>Школа</TH>
                          <TH>Город</TH>
                          <TH>Учеников</TH>
                          <TH className="text-right">Действия</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {schoolsData.map((school) => (
                          <TR key={school.id}>
                            <TD className="font-medium text-strong">{school.name}</TD>
                            <TD>{school.city}</TD>
                            <TD>{school.studentsCount}</TD>
                            <TD>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => detachSchool(school.id)}
                                aria-label="Отвязать школу"
                              >
                                <Unlink className="h-3.5 w-3.5 text-red-400" />
                              </Button>
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Меню выбранного КШП */}
              <Card className="overflow-hidden mt-4">
                <CardHeader>
                  <CardTitle>{selectedKitchen.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-strong">Меню на день</h2>
                    <Button onClick={() => setCreateOpen(true)}>
                      <Plus className="h-4 w-4" /> Добавить блюдо
                    </Button>
                  </div>
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateKitchenOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">Создать</Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
        title="Создать пользователя КШП"
        description={`Пользователь сможет входить в кабинет КШП «${selectedKitchen?.name}»`}
      >
        <form onSubmit={submitKitchenUser} className="grid gap-3 p-4">
          <Field label="E-mail (логин)">
            <Input type="email" name="email" placeholder="kitchen@school.by" />
          </Field>
          <Field label="ФИО">
            <Input name="fullName" placeholder="Иван Петров" />
          </Field>
          <Field label="Пароль" type="password">
            <Input name="password" placeholder="••••••••" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateUserOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">Создать</Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        title="Привязать школу к КШП"
        description={`Выберите школу для привязки к «${selectedKitchen?.name}»`}
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
