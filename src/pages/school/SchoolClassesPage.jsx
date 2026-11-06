import { useMemo, useState } from 'react'
import { ArrowRight, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDeleteClass, useSchoolClasses, useSchoolTeachers } from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { ClassCreateDialog, ClassEditDialog } from '@/features/classes/ClassFormDialog'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { buttonStyles } from '@/shared/ui/button-styles'
import { Card } from '@/shared/ui/card'
import { ConfirmDialog } from '@/shared/ui/dialog'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { Skeleton } from '@/shared/ui/skeleton'
import { StatCard } from '@/shared/ui/stat-card'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/use-toast'
import { todayISO } from '@/shared/lib/date'
import { classesLabel, formatNumber, studentsLabel } from '@/shared/lib/format'
import { AGE_GROUP_LABELS, AGE_GROUP_TONE } from '@/shared/lib/labels'

export default function SchoolClassesPage() {
  const user = useSession((state) => state.user)
  const today = todayISO()
  const classesQuery = useSchoolClasses(user?.schoolId, today)
  const teachersQuery = useSchoolTeachers(user?.schoolId)
  const deleteClass = useDeleteClass()
  const { toast } = useToast()

  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const classes = useMemo(() => {
    const items = classesQuery.data || []
    const search = query.trim().toLowerCase()
    if (!search) return items
    return items.filter(
      (cls) =>
        cls.name.toLowerCase().includes(search) ||
        (cls.teacherNames || []).join(' ').toLowerCase().includes(search),
    )
  }, [classesQuery.data, query])

  const totals = useMemo(() => {
    const items = classesQuery.data || []
    return {
      classes: items.length,
      students: items.reduce((sum, cls) => sum + cls.studentsCount, 0),
      optOuts: items.reduce((sum, cls) => sum + cls.optOutsCount, 0),
      unmarked: items.filter((cls) => !cls.attendance || cls.attendance.status !== 'submitted').length,
    }
  }, [classesQuery.data])

  const handleDelete = async () => {
    try {
      await deleteClass.mutateAsync(deleting.id)
      toast({ title: 'Класс удалён', description: deleting.name, variant: 'success' })
      setDeleting(null)
    } catch (error) {
      toast({ title: 'Не удалось удалить класс', description: error.message, variant: 'error' })
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Школа"
        title="Классы"
        description="Состав классов, возрастные группы и закреплённые учителя."
        actions={
          user?.role !== 'teacher' ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Добавить класс
            </Button>
          ) : null
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Классы" value={formatNumber(totals.classes)} hint={classesLabel(totals.classes)} icon={Users} tone="violet" />
        <StatCard label="Ученики" value={formatNumber(totals.students)} hint={studentsLabel(totals.students)} icon={Users} tone="sky" />
        <StatCard label="Не обедают" value={formatNumber(totals.optOuts)} hint="постоянные отказники" icon={Users} tone="amber" />
        <StatCard
          label="Без отметки сегодня"
          value={formatNumber(totals.unmarked)}
          hint={totals.unmarked ? 'прогноз использует прошлые данные' : 'все классы отмечены'}
          icon={Users}
          tone={totals.unmarked ? 'amber' : 'emerald'}
        />
      </div>

      <Card className="mb-4 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по классу или учителю"
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {classesQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        ) : classesQuery.isError ? (
          <ErrorState description={classesQuery.error.message} onRetry={classesQuery.refetch} />
        ) : !classes.length ? (
          <EmptyState
            icon={Users}
            title={query ? 'Ничего не найдено' : 'Классов пока нет'}
            description={query ? 'Измените запрос.' : 'Добавьте первый класс и назначьте учителя.'}
            action={
              !query ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Добавить класс
                </Button>
              ) : null
            }
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Класс</TH>
                <TH>Группа</TH>
                <TH>Ученики</TH>
                <TH>Не обедают</TH>
                <TH>Учитель</TH>
                <TH>Отметка сегодня</TH>
                <TH className="text-right">Действия</TH>
              </TR>
            </THead>
            <TBody>
              {classes.map((cls) => (
                <TR key={cls.id}>
                  <TD>
                    <Link
                      to={`/school/classes/${cls.id}`}
                      className="font-semibold text-strong hover:text-brand-700"
                    >
                      {cls.name}
                    </Link>
                  </TD>
                  <TD>
                    <Badge tone={AGE_GROUP_TONE[cls.ageGroup]}>{AGE_GROUP_LABELS[cls.ageGroup]}</Badge>
                  </TD>
                  <TD>{formatNumber(cls.studentsCount)}</TD>
                  <TD>{formatNumber(cls.optOutsCount)}</TD>
                  <TD>{cls.teacherNames?.join(', ') || <span className="text-subtle">не назначен</span>}</TD>
                  <TD>
                    <Badge tone={cls.attendance?.status === 'submitted' ? 'success' : 'warning'} dot>
                      {cls.attendance?.status === 'submitted'
                        ? `${formatNumber(cls.attendance.absentCount)} отсутствуют`
                        : 'Не отмечен'}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(cls)} aria-label="Редактировать">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-red-400 hover:bg-red-500/10"
                        onClick={() => setDeleting(cls)}
                        aria-label="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Link
                        to={`/school/classes/${cls.id}`}
                        className={buttonStyles({ variant: 'ghost', size: 'icon-sm' })}
                        aria-label="Открыть"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <ClassCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        schoolId={user?.schoolId}
        teachers={teachersQuery.data || []}
      />
      <ClassEditDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        cls={editing}
        teachers={teachersQuery.data || []}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Удалить класс?"
        description={
          deleting
            ? `Класс «${deleting.name}», его ученики и история отметок будут удалены без возможности восстановления.`
            : ''
        }
        confirmLabel="Удалить"
        loading={deleteClass.isPending}
        onConfirm={handleDelete}
      />
    </>
  )
}
