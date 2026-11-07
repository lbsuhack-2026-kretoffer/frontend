import { useState, useEffect, useCallback } from 'react'
import { Factory, Plus, Menu, Link, Unlink, Trash2, Pencil } from 'lucide-react'
import {
  useCreateKitchen,
  useCreateKitchenUser,
  useDeleteKitchen,
  useKitchenSchools,
  useKitchenUser,
  useLinkKitchenSchools,
  useSetSchoolKitchen,
  useUpdateKitchen,
} from '@/api/hooks'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { ConfirmDialog, Dialog } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { Field, Input, Select } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/use-toast'

function CreateKitchenDialog({ open, onOpenChange, onKitchenCreated }) {
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
    if (!email.trim()) {
      toast({ title: 'Укажите логин (e-mail) общего аккаунта КШП', variant: 'error' })
      return
    }
    if (!fullName.trim()) {
      toast({ title: 'Укажите ФИО сотрудника КШП', variant: 'error' })
      return
    }
    if (!password.trim()) {
      toast({ title: 'Укажите пароль общего аккаунта КШП', variant: 'error' })
      return
    }
    try {
      await createKitchen.mutateAsync({
        name: name.trim(),
        district: district.trim(),
        email: email.trim(),
        fullName: fullName.trim(),
        password: password.trim(),
      })
      toast({ title: 'КШП создано', variant: 'success' })
      setName('')
      setDistrict('')
      setEmail('')
      setFullName('')
      setPassword('')
      await onKitchenCreated?.()
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
        <Field label="ФИО сотрудника КШП" className="sm:col-span-2">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иван Петров" />
        </Field>
        <Field label="Логин общего аккаунта КШП (e-mail)">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kitchen@school.by" />
        </Field>
        <Field label="Пароль общего аккаунта КШП" type="password">
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

function EditKitchenDialog({ open, onOpenChange, kitchen }) {
  const [name, setName] = useState(kitchen?.name || '')
  const [district, setDistrict] = useState(kitchen?.district || '')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const { toast } = useToast()
  const updateKitchen = useUpdateKitchen()
  const { data: kitchenUser } = useKitchenUser(kitchen?.id)

  useEffect(() => {
    if (open && kitchen) {
      setName(kitchen.name || '')
      setDistrict(kitchen.district || '')
      setEmail(kitchenUser?.email || '')
      setFullName(kitchenUser?.fullName || '')
      setPassword('')
    }
  }, [open, kitchen, kitchenUser])

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
      await updateKitchen.mutateAsync({
        kitchenId: kitchen.id,
        payload: {
          name: name.trim(),
          district: district.trim(),
          ...(email.trim() ? { email: email.trim() } : null),
          ...(fullName.trim() ? { fullName: fullName.trim() } : null),
          ...(password.trim() ? { password: password.trim() } : null),
        },
      })
      toast({ title: 'КШП обновлено', variant: 'success' })
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось обновить КШП', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Редактировать КШП">
      <form onSubmit={submit} className="grid gap-3 p-4">
        <Field label="Название КШП" className="sm:col-span-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="КШП Центральный" />
        </Field>
        <Field label="Район">
          <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Центральный район" />
        </Field>
        <Field label="Логин общего аккаунта КШП (e-mail)">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kitchen@school.by" />
        </Field>
        <Field label="ФИО сотрудника КШП" className="sm:col-span-2">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иван Петров" />
        </Field>
        <Field label="Новый пароль общего аккаунта КШП" type="password">
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit">Сохранить</Button>
        </div>
      </form>
    </Dialog>
  )
}

export default function PlatformKitchenPage() {
  const [kitchens, setKitchens] = useState([])
  const [selectedKitchen, setSelectedKitchen] = useState(null)
  const [kitchenSchools, setKitchenSchools] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [kitchenToDelete, setKitchenToDelete] = useState(null)
  const [kitchenToEdit, setKitchenToEdit] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDistrict, setEditDistrict] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editFullName, setEditFullName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const setSchoolKitchen = useSetSchoolKitchen()
  const linkKitchenSchools = useLinkKitchenSchools()
  const deleteKitchen = useDeleteKitchen()
  const updateKitchen = useUpdateKitchen()

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

  const kitchenSchoolsQuery = useKitchenSchools(selectedKitchen?.id)
  const { data: schoolsData } = kitchenSchoolsQuery

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
      await loadKitchens()
    } catch (error) {
      toast({ title: 'Не удалось отвязать школу', description: error.message, variant: 'error' })
    }
  }

  const handleLinkDistrictSchools = async () => {
    if (!selectedKitchen?.id) return
    try {
      const res = await linkKitchenSchools.mutateAsync(selectedKitchen.id)
      toast({
        title: 'Школы привязаны к КШП',
        description: `Привязано школ: ${res.linked || 0} (район: ${selectedKitchen.district})`,
        variant: 'success',
      })
      await loadKitchens()
      if (selectedKitchen?.id) {
        await kitchenSchoolsQuery.refetch()
      }
    } catch (error) {
      toast({ title: 'Не удалось привязать школы', description: error.message, variant: 'error' })
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
      if (selectedKitchen?.id === kitchenToDelete.id) {
        setSelectedKitchen(null)
      }
    } catch (error) {
      toast({ title: 'Не удалось удалить КШП', description: error.message, variant: 'error' })
    }
  }

  const openEditKitchen = (kitchen) => {
    setKitchenToEdit(kitchen)
    setEditName(kitchen.name || '')
    setEditDistrict(kitchen.district || '')
    setEditEmail('')
    setEditFullName('')
    setEditPassword('')
    setEditOpen(true)
  }

  const handleUpdateKitchen = async () => {
    if (!kitchenToEdit) return
    const payload = {}
    if (editName.trim()) payload.name = editName.trim()
    if (editDistrict.trim()) payload.district = editDistrict.trim()
    if (editEmail.trim()) payload.email = editEmail.trim()
    if (editFullName.trim()) payload.fullName = editFullName.trim()
    if (editPassword.trim()) payload.password = editPassword.trim()
    try {
      await updateKitchen.mutateAsync({ kitchenId: kitchenToEdit.id, payload })
      toast({ title: 'КШП обновлено', variant: 'success' })
      setEditOpen(false)
      setKitchenToEdit(null)
      setEditName('')
      setEditDistrict('')
      setEditEmail('')
      setEditFullName('')
      setEditPassword('')
      await loadKitchens()

      // Обновить выбранную кьюшню, чтобы новые значения сразу были видны на странице
      if (selectedKitchen?.id === kitchenToEdit.id) {
        const updated = kitchens.find((k) => k.id === kitchenToEdit.id)
        if (updated) setSelectedKitchen(updated)
      }

      // Если изменился район — отвязываем все школы от КШП (КШП обслуживает только свой район)
      if (payload.district && payload.district !== kitchenToEdit.district && kitchenSchools.length > 0) {
        for (const school of kitchenSchools) {
          await setSchoolKitchen.mutateAsync({ schoolId: school.id, kitchenId: null })
        }
        toast({ title: 'Район изменён. Все школы отвязаны от КШП', variant: 'warning' })
        if (selectedKitchen?.id === kitchenToEdit.id) {
          setSelectedKitchen(null)
        }
      }
    } catch (error) {
      toast({ title: 'Не удалось обновить КШП', description: error.message, variant: 'error' })
    }
  }

  const selectKitchen = (kitchen) => {
    setSelectedKitchen(kitchen)
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
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium text-strong">{kitchen.name}</div>
                          <div className="text-[11px] text-muted">{kitchen.district}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditKitchen(kitchen)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Редактировать
                        </Button>
                      </div>
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
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Школы КШП: {selectedKitchen.name}</CardTitle>
                  <Button
                    size="sm"
                    onClick={handleLinkDistrictSchools}
                    disabled={!selectedKitchen?.id || linkKitchenSchools.isPending}
                  >
                    <Link className="h-3.5 w-3.5 mr-1" />
                    Привязать все школы района
                  </Button>
                </CardHeader>
                <CardContent className="pt-2">
                  {kitchenSchools.length === 0 ? (
                    <EmptyState
                      icon={Link}
                      title="Школ пока нет"
                      description="Привяжите школы этого района к КШП"
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

            </>
          )}
        </div>
      </div>

      <CreateKitchenDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onKitchenCreated={loadKitchens}
      />
      <EditKitchenDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        kitchen={kitchenToEdit}
      />
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
