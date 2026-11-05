import { useState } from 'react'
import {
  ArrowLeft,
  Ban,
  BookOpen,
  CheckCircle2,
  Clock,
  DoorOpen,
  GraduationCap,
  Mail,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Users,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import {
  useAssignSchoolAdmin,
  useRevokeSchoolAdmin,
  useSchool,
  useSetSchoolAccess,
  useSchoolClasses,
  useSchoolTeachers,
} from '@/api/hooks'
import { SchoolEditDialog } from '@/features/schools/SchoolFormDialog'
import { Avatar } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { ConfirmDialog, Dialog } from '@/shared/ui/dialog'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { Field, Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { StatCard } from '@/shared/ui/stat-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/use-toast'
import { formatDate } from '@/shared/lib/date'
import { classesLabel, formatNumber, studentsLabel } from '@/shared/lib/format'
import { AGE_GROUP_LABELS, MEAL_PLAN_LABELS, ROLE_LABELS } from '@/shared/lib/labels'

function AssignAdminDialog({ open, onOpenChange, schoolId }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const assign = useAssignSchoolAdmin()
  const { toast } = useToast()

  const submit = async (event) => {
    event.preventDefault()
    if (!email.trim()) {
      toast({ title: 'Укажите e-mail завуча', variant: 'error' })
      return
    }
    try {
      await assign.mutateAsync({ schoolId, payload: { fullName, email } })
      toast({ title: 'Завуч назначен', description: email, variant: 'success' })
      setFullName('')
      setEmail('')
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось назначить', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Назначить завуча"
      description="Пользователь получит доступ к управлению школой."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" form="assign-admin-form" loading={assign.isPending}>
            Назначить
          </Button>
        </>
      }
    >
      <form id="assign-admin-form" onSubmit={submit} className="grid gap-3">
        <Field label="ФИО">
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Иван Петров" />
        </Field>
        <Field label="E-mail" hint="Если пользователь уже есть, ему обновят роль">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="zavuch@school.by"
          />
        </Field>
      </form>
    </Dialog>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-right text-xs font-medium text-strong">{value || '—'}</span>
    </div>
  )
}

export default function PlatformSchoolPage() {
  const { schoolId } = useParams()
  const schoolQuery = useSchool(schoolId)
  const classesQuery = useSchoolClasses(schoolId)
  const teachersQuery = useSchoolTeachers(schoolId)
  const setAccess = useSetSchoolAccess()
  const revokeAdmin = useRevokeSchoolAdmin()
  const { toast } = useToast()

  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [adminToRevoke, setAdminToRevoke] = useState(null)

  if (schoolQuery.isLoading) return <PageSkeleton />
  if (schoolQuery.isError) {
    return <ErrorState description={schoolQuery.error.message} onRetry={schoolQuery.refetch} />
  }

  const school = schoolQuery.data

  const toggleAccess = async () => {
    try {
      await setAccess.mutateAsync({ schoolId, enabled: !school.accessEnabled })
      toast({
        title: school.accessEnabled ? 'Доступ заблокирован' : 'Доступ восстановлен',
        description: school.name,
        variant: 'success',
      })
    } catch (error) {
      toast({ title: 'Не удалось изменить доступ', description: error.message, variant: 'error' })
    }
  }

  const handleRevoke = async () => {
    try {
      await revokeAdmin.mutateAsync({ schoolId, userId: adminToRevoke.id })
      toast({ title: 'Доступ завуча отозван', description: adminToRevoke.fullName, variant: 'success' })
      setAdminToRevoke(null)
    } catch (error) {
      toast({ title: 'Не удалось отозвать доступ', description: error.message, variant: 'error' })
    }
  }

  return (
    <>
      <Link to="/platform/schools" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-strong">
        <ArrowLeft className="h-3.5 w-3.5" />
        Все школы
      </Link>

      <PageHeader
        eyebrow="Школа"
        title={school.name}
        description={`${school.city}${school.address ? ` · ${school.address}` : ''} · ${MEAL_PLAN_LABELS[school.mealPlan]}`}
        actions={
          <>
            <Badge tone={school.accessEnabled ? 'success' : 'danger'} dot>
              {school.accessEnabled ? 'Доступ активен' : 'Доступ заблокирован'}
            </Badge>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Редактировать
            </Button>
            <Button
              variant={school.accessEnabled ? 'danger-outline' : 'primary'}
              onClick={toggleAccess}
              loading={setAccess.isPending}
            >
              {school.accessEnabled ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {school.accessEnabled ? 'Блокировать' : 'Разблокировать'}
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ученики" value={formatNumber(school.studentsCount)} hint={studentsLabel(school.studentsCount)} icon={Users} tone="sky" />
        <StatCard label="Классы" value={formatNumber(school.classesCount)} hint={classesLabel(school.classesCount)} icon={BookOpen} tone="violet" />
        <StatCard label="Учителя" value={formatNumber(school.teachersCount)} hint="с доступом к отметкам" icon={GraduationCap} tone="brand" />
        <StatCard label="Буфер" value={`${school.bufferPercent}%`} hint={`дедлайн отметки ${school.attendanceDeadline}`} icon={Clock} tone="amber" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="admins">Администраторы</TabsTrigger>
          <TabsTrigger value="classes">Классы</TabsTrigger>
          <TabsTrigger value="teachers">Учителя</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Данные школы</CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <DetailRow label="Город" value={school.city} />
                <DetailRow label="Адрес" value={school.address} />
                <DetailRow label="Телефон" value={school.phone} />
                <DetailRow label="E-mail" value={school.email} />
                <DetailRow label="Схема питания" value={MEAL_PLAN_LABELS[school.mealPlan]} />
                <DetailRow label="Таймзона" value={school.timezone} />
                <DetailRow label="Буфер на погрешность" value={`${school.bufferPercent}%`} />
                <DetailRow label="Дедлайн отметки" value={school.attendanceDeadline} />
                <DetailRow label="Подключена" value={formatDate(school.createdAt)} />
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Интеграции</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 pt-2">
                  <div className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-elevated text-muted">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-strong">Касса / электронная оплата</p>
                      <p className="text-[11px] text-muted">Транзакции для шведского стола</p>
                    </div>
                    <Badge tone={school.integrations?.pos ? 'success' : 'neutral'}>
                      {school.integrations?.pos ? 'Подключено' : 'Не подключено'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-elevated text-muted">
                      <DoorOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-strong">СКУД / турникеты</p>
                      <p className="text-[11px] text-muted">Автоматическая отметка входа</p>
                    </div>
                    <Badge tone={school.integrations?.skud ? 'success' : 'neutral'}>
                      {school.integrations?.skud ? 'Подключено' : 'Не подключено'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Администраторы школы</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Назначить
                  </Button>
                </CardHeader>
                <CardContent className="pt-2">
                  {!school.admins?.length ? (
                    <EmptyState title="Завуч не назначен" description="Назначьте администратора школы." />
                  ) : (
                    <div className="space-y-2">
                      {school.admins.map((admin) => (
                        <div key={admin.id} className="flex items-center gap-2.5 rounded-xl bg-app p-2.5">
                          <Avatar name={admin.fullName} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-strong">{admin.fullName}</p>
                            <p className="truncate text-[11px] text-muted">{admin.email}</p>
                          </div>
                          <Badge tone="brand">{ROLE_LABELS[admin.role]}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Администраторы</CardTitle>
                <p className="mt-1 text-xs text-muted">Управление доступом завучей к школе</p>
              </div>
              <Button size="sm" onClick={() => setAssignOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Назначить завуча
              </Button>
            </CardHeader>
            <CardContent className="pt-2">
              {!school.admins?.length ? (
                <EmptyState title="Завуч не назначен" description="Назначьте администратора школы." />
              ) : (
                <div className="divide-y divide-line">
                  {school.admins.map((admin) => (
                    <div key={admin.id} className="flex items-center gap-3 py-3">
                      <Avatar name={admin.fullName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-strong">{admin.fullName}</p>
                        <p className="truncate text-xs text-muted">{admin.email}</p>
                      </div>
                      <Badge tone="brand">{admin.position}</Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setAdminToRevoke(admin)}
                        aria-label="Отозвать доступ"
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>Классы школы</CardTitle>
                <p className="mt-1 text-xs text-muted">Состав классов и закреплённые учителя</p>
              </div>
            </CardHeader>
            {classesQuery.isLoading ? (
              <div className="p-4 text-xs text-muted">Загрузка…</div>
            ) : classesQuery.isError ? (
              <ErrorState description={classesQuery.error.message} onRetry={classesQuery.refetch} />
            ) : !classesQuery.data?.length ? (
              <EmptyState title="Классов пока нет" />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Класс</TH>
                    <TH>Возрастная группа</TH>
                    <TH>Ученики</TH>
                    <TH>Не обедают</TH>
                    <TH>Учитель</TH>
                  </TR>
                </THead>
                <TBody>
                  {classesQuery.data.map((cls) => (
                    <TR key={cls.id}>
                      <TD className="font-medium text-strong">{cls.name}</TD>
                      <TD>
                        <Badge tone={cls.ageGroup === 'junior' ? 'sky' : cls.ageGroup === 'middle' ? 'violet' : 'warning'}>
                          {AGE_GROUP_LABELS[cls.ageGroup]}
                        </Badge>
                      </TD>
                      <TD>{formatNumber(cls.studentsCount)}</TD>
                      <TD>{formatNumber(cls.optOutsCount)}</TD>
                      <TD>{cls.teacherNames?.join(', ') || '—'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Учителя</CardTitle>
                <p className="mt-1 text-xs text-muted">Сотрудники с доступом к отметке классов</p>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {teachersQuery.isLoading ? (
                <p className="text-xs text-muted">Загрузка…</p>
              ) : teachersQuery.isError ? (
                <ErrorState description={teachersQuery.error.message} onRetry={teachersQuery.refetch} />
              ) : !teachersQuery.data?.length ? (
                <EmptyState icon={GraduationCap} title="Учителей пока нет" />
              ) : (
                <div className="divide-y divide-line">
                  {teachersQuery.data.map((teacher) => (
                    <div key={teacher.id} className="flex flex-wrap items-center gap-3 py-3">
                      <Avatar name={teacher.fullName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-strong">{teacher.fullName}</p>
                        <p className="text-xs text-muted">
                          <Mail className="mr-1 inline h-3 w-3" />
                          {teacher.email}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {teacher.classes?.length ? (
                          teacher.classes.map((cls) => (
                            <Badge key={cls.id} tone="neutral">
                              {cls.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[11px] text-subtle">Без класса</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SchoolEditDialog open={editOpen} onOpenChange={setEditOpen} school={school} scope="platform" />
      <AssignAdminDialog open={assignOpen} onOpenChange={setAssignOpen} schoolId={schoolId} />
      <ConfirmDialog
        open={Boolean(adminToRevoke)}
        onOpenChange={(open) => !open && setAdminToRevoke(null)}
        title="Отозвать доступ?"
        description={
          adminToRevoke
            ? `${adminToRevoke.fullName} потеряет доступ к управлению школой «${school.name}».`
            : ''
        }
        confirmLabel="Отозвать"
        loading={revokeAdmin.isPending}
        onConfirm={handleRevoke}
      />
    </>
  )
}
