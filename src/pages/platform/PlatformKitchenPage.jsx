import { useState, useEffect, useCallback } from 'react'
import { Factory, Plus, Utensils, Menu, Link, Unlink } from 'lucide-react'
import { useCreateKitchen, useCreateKitchenUser, useCreateMenuItem, useKitchenSchools, useSetSchoolKitchen } from '@/api/hooks'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Dialog } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { Field, Input, Select } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/use-toast'

function CreateKitchenDialog({ open, onOpenChange }) {
  const [name, setName] = useState('')
  const [district, setDistrict] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
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
      await createKitchen.mutateAsync({
        name: name.trim(),
        district: district.trim(),
        email: email.trim() || undefined,
        fullName: fullName.trim() || undefined,
        password: password.trim() || undefined,
      })
      toast({ title: 'КШП создано', variant: 'success' })
      setName('')
      setDistrict('')
      setEmail('')
      setFullName('')
      setPassword('')
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
        <Field label="E-mail пользователя КШП (логин)">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kitchen@school.by" />
        </Field>
        <Field label="ФИО пользователя КШП">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иван Петров" />
        </Field>
        <Field label="Пароль пользователя КШП" type="password">
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
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

function AttachSchoolDialog({ open, onOpenChange, kitchenId, schools }) {
  const [schoolId, setSchoolId] = useState('')
  const { toast } = useToast()
  const setSchoolKitchen = useSetSchoolKitchen()

  const submit = async (event) => {
    event.preventDefault()
    if (!schoolId) {
      toast({ title: 'Выберите школу', variant: 'error' })
      return
    }
    try {
      await setSchoolKitchen.mutateAsync({ schoolId, kitchenId })
      toast({ title: 'Школа привязана к КШП', variant: 'success' })
      setSchoolId('')
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось привязать школу', description: error.message, variant: 'error' })
    }
  }

  const available = schools.filter((s) => !s.kitchenId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Привязать школу к КШП">
      <form onSubmit={submit} className="grid gap-3 p-4">
        <Field label="Школа" className="sm:col-span-2">
          <Select value={schoolId} onValueChange={setSchoolId}>
            <option value="">Выберите школу</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.city}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" disabled={!schoolId}>
            Привязать
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export default function PlatformKitchenPage() {
  const [kitchens, setKitchens] = useState([])
  const [selectedKitchen, setSelectedKitchen] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [kitchenSchools, setKitchenSchools] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [attachOpen, setAttachOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const setSchoolKitchen = useSetSchoolKitchen()

  const loadKitchens = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/platform/kitchens', { credentials: 'include', cache: 'no-store' })
      if (!res.ok) throw new Error('Не удалось загрузить КШП')
      const data = await res.json()
      setKitchens(data)
    } catch (error) {
      toast({ title: 'Не удалось загрузить КШП', description: error.message, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadMenu = async (kitchenId) => {
    if (!kitchenId) return
    try {
      const res = await fetch(`/api/v1/kitchen/kitchens/${kitchenId}/menu`, { credentials: 'include', cache: 'no-store' })
      if (!res.ok) throw new Error(`Ошибка ${res.status}: не удалось загрузить меню`)
      const data = await res.json()
      setMenuItems(data || [])
    } catch (error) {
      toast({ title: 'Не удалось загрузить меню', description: error.message, variant: 'error' })
    }
  }

  const { data: schoolsData } = useKitchenSchools(selectedKitchen?.id)

  useEffect(() => {
    if (schoolsData) setKitchenSchools(schoolsData)
  }, [schoolsData])

  useEffect(() => {
    loadKitchens()
  }, [])

  const detachSchool = async (schoolId) => {
    try {
      await setSchoolKitchen.mutateAsync({ schoolId, kitchenId: null })
      toast({ title: 'Школа отвязана от КШП', variant: 'success' })
    } catch (error) {
      toast({ title: 'Не удалось отвязать школу', description: error.message, variant: 'error' })
    }
  }

  const selectKitchen = async (kitchen) => {
    setSelectedKitchen(kitchen)
    await loadMenu(kitchen.id)
  }

  return (
    <>
      <PageHeader
        eyebrow="Платформа"
        title="КШП / комбинат школьного питания"
        description="Управление комбинатами питания, меню и привязкой школ вашего района"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Factory className="h-4 w-4" />
            Создать КШП
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        {/* Список КШП */}
        <div className="lg:col-span-4">
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
                <div className="space-y-2">
                  {kitchens.map((kitchen) => (
                    <div key={kitchen.id} className="flex items-center justify-between p-3 rounded-lg border border-line hover:bg-elevated cursor-pointer transition-colors group" onClick={() => selectKitchen(kitchen)}>
                      <div>
                        <div className="font-medium text-strong">{kitchen.name}</div>
                        <div className="text-[11px] text-muted">{kitchen.district}</div>
                        <div className="text-[10px] text-muted">{kitchenSchools.filter((s) => s.kitchenId === kitchen.id).length} школа(й)</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation()
                        setSelectedKitchen(kitchen)
                        loadMenu(kitchen.id)
                      }}>
                        <Utensils className="h-3.5 w-3.5 mr-1" />
                        Меню
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Детали КШП: меню + школы */}
        <div className="lg:col-span-8">
          {!selectedKitchen ? (
            <EmptyState
              icon={Menu}
              title="Выберите КШП"
              description="Выберите комбинат питания слева, чтобы управлять меню и школами"
            />
          ) : (
            <>
              {/* Школы КШП */}
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Школы КШП: {selectedKitchen.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {kitchenSchools.length === 0 ? (
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
                        {kitchenSchools.map((school) => (
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

              {/* Меню КШП */}
              <Card className="overflow-hidden mt-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Меню КШП: {selectedKitchen.name}</CardTitle>
                    <Button onClick={() => setMenuOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Добавить блюдо
                    </Button>
                    <Button variant="outline" onClick={() => setMenuOpen(false)}>
                      Закрыть
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {menuItems.length === 0 ? (
                    <EmptyState icon={Utensils} title="Блюд пока нет" description="Добавьте первое блюдо в меню" />
                  ) : (
                    <Table>
                      <THead>
                        <TR>
                          <TH>Блюдо</TH>
                          <TH className="text-right">Цена, BYN</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {menuItems.map((item) => (
                          <TR key={item.id}>
                            <TD>{item.name}</TD>
                            <TD className="text-right">{item.price.toFixed(2)}</TD>
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

      <CreateKitchenDialog open={createOpen} onOpenChange={setCreateOpen} />
      <MenuItemDialog open={menuOpen} onOpenChange={setMenuOpen} kitchenId={selectedKitchen?.id} />
      <AttachSchoolDialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        kitchenId={selectedKitchen?.id}
        schools={kitchenSchools}
      />
    </>
  )
}

function CreateKitchenUserDialog({ open, onOpenChange, kitchenId }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const { toast } = useToast()
  const createKitchenUser = useCreateKitchenUser()

  const submit = async (event) => {
    event.preventDefault()
    if (!kitchenId) return
    if (!email.trim() || !fullName.trim() || !password.trim()) {
      toast({ title: 'Заполните все поля', variant: 'error' })
      return
    }
    try {
      await createKitchenUser.mutateAsync({
        kitchenId,
        payload: { email: email.trim(), fullName: fullName.trim(), password },
      })
      toast({ title: 'Пользователь КШП создан', variant: 'success' })
      setEmail('')
      setFullName('')
      setPassword('')
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось создать пользователя', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Создать пользователя КШП">
      <form onSubmit={submit} className="grid gap-3 p-4">
        <Field label="E-mail (логин)">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kitchen@school.by"
          />
        </Field>
        <Field label="ФИО">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иван Петров" />
        </Field>
        <Field label="Пароль" type="password">
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
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
