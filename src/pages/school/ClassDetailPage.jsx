import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  Users,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useAssignTeacher,
  useClassDetail,
  useClassStudents,
  useDeleteClass,
  useDeleteStudent,
  useSchoolTeachers,
  useUpdateStudent,
} from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { ClassEditDialog } from '@/features/classes/ClassFormDialog'
import { AddStudentDialog } from '@/features/students/AddStudentDialog'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { ConfirmDialog } from '@/shared/ui/dialog'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { Input, Select } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { StatCard } from '@/shared/ui/stat-card'
import { Switch } from '@/shared/ui/switch'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/use-toast'
import { todayISO } from '@/shared/lib/date'
import { formatNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { AGE_GROUP_LABELS, AGE_GROUP_TONE, MEAL_STATUS_LABELS } from '@/shared/lib/labels'

const SEARCH_MODES = [
  { value: 'surname', label: 'Фамилия' },
  { value: 'firstname', label: 'Имя' },
  { value: 'middlename', label: 'Отчество' },
]

export default function ClassDetailPage() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const user = useSession((state) => state.user)
  const today = todayISO()

  const classQuery = useClassDetail(classId, today)
  const studentsQuery = useClassStudents(classId)
  const teachersQuery = useSchoolTeachers(user?.schoolId)
  const updateStudent = useUpdateStudent()
  const deleteStudent = useDeleteStudent()
  const deleteClass = useDeleteClass()
  const assignTeacher = useAssignTeacher()
  const { toast } = useToast()

  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState('surname')
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState(null)
  const [deleteClassOpen, setDeleteClassOpen] = useState(false)

  const students = useMemo(() => {
    const items = studentsQuery.data || []
    const search = query.trim().toLowerCase()
    if (!search) return items
    return items.filter((student) => {
      const parts = student.fullName.toLowerCase().split(/\s+/)
      const surname = parts[0] || ''
      const firstName = parts[1] || ''
      const middleName = parts[2] || ''
      const field = searchMode === 'firstname' ? firstName : searchMode === 'middlename' ? middleName : surname
      return field.startsWith(search)
    })
  }, [studentsQuery.data, query, searchMode])

  if (classQuery.isLoading) return <PageSkeleton />
  if (classQuery.isError) {
    return <ErrorState description={classQuery.error.message} onRetry={classQuery.refetch} />
  }

  const cls = classQuery.data
  const optOuts = (studentsQuery.data || []).filter((student) => student.mealStatus === 'optOut').length

  const toggleMealStatus = async (student, checked) => {
    try {
      await updateStudent.mutateAsync({
        studentId: student.id,
        payload: { mealStatus: checked ? 'regular' : 'opt_out' },
      })
    } catch (error) {
      toast({ title: 'Не удалось обновить статус', description: error.message, variant: 'error' })
    }
  }

  const handleDeleteStudent = async () => {
    try {
      await deleteStudent.mutateAsync(studentToDelete.id)
      toast({ title: 'Ученик удалён', description: studentToDelete.fullName, variant: 'success' })
      setStudentToDelete(null)
    } catch (error) {
      toast({ title: 'Не удалось удалить ученика', description: error.message, variant: 'error' })
    }
  }

  const handleDeleteClass = async () => {
    try {
      await deleteClass.mutateAsync(classId)
      toast({ title: 'Класс удалён', variant: 'success' })
      navigate('/school/classes')
    } catch (error) {
      toast({ title: 'Не удалось удалить класс', description: error.message, variant: 'error' })
    }
  }

  const handleTeacherChange = async (event) => {
    try {
      await assignTeacher.mutateAsync({ classId, teacherId: event.target.value || null })
      toast({ title: 'Учитель класса обновлён', variant: 'success' })
    } catch (error) {
      toast({ title: 'Не удалось назначить учителя', description: error.message, variant: 'error' })
    }
  }

  return (
    <>
      <Link
        to="/school/classes"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Все классы
      </Link>

      <PageHeader
        eyebrow="Класс"
        title={cls.name}
        description={`${AGE_GROUP_LABELS[cls.ageGroup]} · ${formatNumber(cls.studentsCount)} учеников`}
        actions={
          <>
            <Badge tone={AGE_GROUP_TONE[cls.ageGroup]}>{AGE_GROUP_LABELS[cls.ageGroup]}</Badge>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Редактировать
            </Button>
            <Button variant="danger-outline" onClick={() => setDeleteClassOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Удалить
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ученики" value={formatNumber(cls.studentsCount)} icon={Users} tone="sky" />
        <StatCard label="Не обедают" value={formatNumber(optOuts)} hint={MEAL_STATUS_LABELS.optOut} icon={UserRoundX} tone="amber" />
        <StatCard
          label="Отметка сегодня"
          value={cls.attendance?.status === 'submitted' ? 'Есть' : 'Нет'}
          hint={cls.attendance?.status === 'submitted' ? `${cls.attendance.absentCount} отсутствуют` : 'ожидается до дедлайна'}
          icon={CheckCircle2}
          tone={cls.attendance?.status === 'submitted' ? 'emerald' : 'amber'}
        />
        <StatCard label="Учитель" value={cls.teacherNames?.[0] || '—'} hint="закреплён за классом" icon={UserRoundCheck} tone="brand" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <CardHeader>
            <CardTitle>Настройки класса</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div>
              <p className="mb-1.5 text-xs font-medium text-body">Учитель класса</p>
              <Select value={cls.teacherIds?.[0] || ''} onChange={handleTeacherChange}>
                <option value="">Не назначен</option>
                {(teachersQuery.data || []).map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-[11px] text-muted">
                Учитель увидит класс на своём экране и сможет отметить отсутствующих.
              </p>
            </div>
            <div className="rounded-xl bg-app p-3 text-[11px] text-muted">
              <p>
                Возрастная группа влияет на разбивку прогноза и заявку для КШП. При смене параллели группа
                пересчитывается автоматически.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Ученики</CardTitle>
              <p className="mt-1 text-xs text-muted">Постоянные отказники не попадают в расчёт порций</p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={searchMode}
                onChange={(event) => setSearchMode(event.target.value)}
                className="w-[100px]"
              >
                {SEARCH_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </Select>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Добавить
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Первые буквы"
                className="pl-9"
              />
            </div>

            {studentsQuery.isLoading ? (
              <p className="py-6 text-center text-xs text-muted">Загрузка…</p>
            ) : studentsQuery.isError ? (
              <ErrorState description={studentsQuery.error.message} onRetry={studentsQuery.refetch} />
            ) : !students.length ? (
              <EmptyState
                icon={Users}
                title={query ? 'Ничего не найдено' : 'В классе пока нет учеников'}
                description={query ? 'Измените запрос.' : 'Добавьте учеников, чтобы класс участвовал в прогнозе.'}
              />
            ) : (
              <Table className="min-w-full">
                <THead>
                  <TR>
                    <TH>Ученик</TH>
                    <TH>Карта</TH>
                    <TH>Обедает</TH>
                    <TH className="text-right">Действия</TH>
                  </TR>
                </THead>
                <TBody>
                  {students.map((student) => (
                    <TR key={student.id}>
                      <TD className="font-medium text-strong">{student.fullName}</TD>
                      <TD className="text-xs text-muted">{student.cardNumber}</TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={student.mealStatus === 'regular'}
                            onCheckedChange={(checked) => toggleMealStatus(student, checked)}
                            aria-label={`Питание ${student.fullName}`}
                          />
                          <span
                            className={cn(
                              'text-xs font-medium',
                              student.mealStatus === 'regular'
                                ? 'text-emerald-700'
                                : 'text-amber-700',
                            )}
                          >
                            {student.mealStatus === 'regular' ? 'Обедает' : 'Не обедает'}
                          </span>
                        </div>
                      </TD>
                      <TD>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-red-400 hover:bg-red-500/10"
                            onClick={() => setStudentToDelete(student)}
                            aria-label="Удалить ученика"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ClassEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        cls={cls}
        teachers={teachersQuery.data || []}
      />
      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} classId={classId} />
      <ConfirmDialog
        open={Boolean(studentToDelete)}
        onOpenChange={(open) => !open && setStudentToDelete(null)}
        title="Удалить ученика?"
        description={studentToDelete ? `${studentToDelete.fullName} будет удалён из класса и прогноза.` : ''}
        confirmLabel="Удалить"
        loading={deleteStudent.isPending}
        onConfirm={handleDeleteStudent}
      />
      <ConfirmDialog
        open={deleteClassOpen}
        onOpenChange={setDeleteClassOpen}
        title="Удалить класс?"
        description={`Класс «${cls.name}», ученики и история отметок будут удалены.`}
        confirmLabel="Удалить класс"
        loading={deleteClass.isPending}
        onConfirm={handleDeleteClass}
      />
    </>
  )
}
