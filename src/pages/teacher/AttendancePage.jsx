import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCheck,
  CheckCircle2,
  Clock,
  Info,
  RotateCcw,
  Save,
  Search,
  UserRoundX,
  Users,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAttendance, useSaveAttendance } from '@/api/hooks'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { useToast } from '@/shared/ui/use-toast'
import { formatDate, relativeDayLabel, todayISO } from '@/shared/lib/date'
import { formatNumber, studentsLabel } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

function setsEqual(a, b) {
  if (a.size !== b.size) return false
  for (const item of a) if (!b.has(item)) return false
  return true
}

export default function AttendancePage() {
  const { classId } = useParams()
  const { toast } = useToast()
  const [date, setDate] = useState(todayISO())
  const query = useAttendance(classId, date)
  const save = useSaveAttendance()

  const [draft, setDraft] = useState(null)
  const [search, setSearch] = useState('')

  const savedAbsent = useMemo(
    () => new Set(query.data?.absentStudentIds || []),
    [query.data?.absentStudentIds],
  )

  const absent = draft?.date === date ? draft.ids : savedAbsent

  const updateAbsent = (updater) => {
    setDraft((current) => {
      const base = current?.date === date ? current.ids : savedAbsent
      const next = typeof updater === 'function' ? updater(base) : updater
      return { date, ids: next }
    })
  }

  const students = useMemo(() => {
    const items = query.data?.students || []
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((student) => student.fullName.toLowerCase().includes(term))
  }, [query.data?.students, search])

  const stats = useMemo(() => {
    const items = query.data?.students || []
    const regular = items.filter((student) => student.mealStatus === 'regular')
    const optOuts = items.length - regular.length
    const absentRegular = regular.filter((student) => absent.has(student.id)).length
    return {
      total: items.length,
      regular: regular.length,
      optOuts,
      absent: absentRegular,
      present: Math.max(0, regular.length - absentRegular),
    }
  }, [query.data?.students, absent])

  if (query.isLoading) return <PageSkeleton />
  if (query.isError) {
    return <ErrorState description={query.error.message} onRetry={query.refetch} />
  }

  const data = query.data
  const dirty = !setsEqual(absent, savedAbsent)
  const marked = data.status === 'marked'

  const toggleStudent = (studentId, checked) => {
    updateAbsent((current) => {
      const next = new Set(current)
      if (checked) next.add(studentId)
      else next.delete(studentId)
      return next
    })
  }

  const markAllPresent = () => updateAbsent(new Set())
  const resetChanges = () => {
    setDraft(null)
    setSearch('')
  }

  const handleSave = async () => {
    try {
      await save.mutateAsync({
        classId,
        date,
        absentStudentIds: [...absent],
      })
      toast({
        title: 'Отметка сохранена',
        description: `${data.className} · ${studentsLabel(stats.present)} придут на обед`,
        variant: 'success',
      })
    } catch (error) {
      toast({ title: 'Не удалось сохранить отметку', description: error.message, variant: 'error' })
    }
  }

  return (
    <>
      <Link
        to="/teacher"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Мои классы
      </Link>

      <PageHeader
        eyebrow={data.schoolName}
        title={`Отметка · ${data.className}`}
        description={`${formatDate(date, 'd MMMM, EEEE')} · ${relativeDayLabel(date)} · дедлайн ${data.deadline}`}
        actions={
          <>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <Input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(event) => setDate(event.target.value || todayISO())}
                className="w-[170px] pl-9"
              />
            </div>
            <Badge tone={marked ? 'success' : 'warning'} dot>
              {marked ? 'Отмечен' : 'Не отмечен'}
            </Badge>
          </>
        }
      />

      <div className="print-area">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-xs text-muted">Всего учеников</p>
            <p className="mt-1 text-2xl font-semibold text-strong">{formatNumber(stats.total)}</p>
            <p className="mt-1 text-[11px] text-muted">не обедают {formatNumber(stats.optOuts)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-xs text-muted">Присутствуют</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-300">{formatNumber(stats.present)}</p>
            <p className="mt-1 text-[11px] text-muted">пойдут на обед</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-xs text-muted">Отсутствуют</p>
            <p className="mt-1 text-2xl font-semibold text-red-400">{formatNumber(stats.absent)}</p>
            <p className="mt-1 text-[11px] text-muted">отмечено вручную</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-xs text-muted">Сохранено</p>
            <p className="mt-1 text-2xl font-semibold text-strong">{data.submittedAt || '—'}</p>
            <p className="mt-1 truncate text-[11px] text-muted">
              {data.submittedByName ? `кем: ${data.submittedByName}` : 'ещё не сохраняли'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <Card className="overflow-hidden">
            <CardHeader className="gap-2">
              <div>
                <CardTitle>Ученики класса</CardTitle>
                <p className="mt-1 text-xs text-muted">
                  Отметьте галочкой тех, кто отсутствует. Остальные считаются присутствующими.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={markAllPresent} disabled={!marked && !absent.size}>
                  <CheckCheck className="h-3.5 w-3.5" />
                  Все на месте
                </Button>
                <Button size="sm" variant="ghost" onClick={resetChanges} disabled={!dirty && !search}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Сбросить
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Найти ученика по фамилии"
                  className="pl-9"
                />
              </div>

              {!students.length ? (
                <EmptyState
                  icon={Users}
                  title={search ? 'Ничего не найдено' : 'В классе нет учеников'}
                  description={search ? 'Измените запрос.' : 'Обратитесь к завучу.'}
                />
              ) : (
                <ul className="divide-y divide-line">
                  {students.map((student) => {
                    const isOptOut = student.mealStatus === 'optOut'
                    const isAbsent = absent.has(student.id)
                    return (
                      <li key={student.id}>
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-3 py-3 pr-1 transition-colors',
                            isOptOut ? 'cursor-default opacity-70' : 'hover:bg-elevated/70',
                          )}
                        >
                          <Checkbox
                            checked={isAbsent}
                            disabled={isOptOut}
                            onCheckedChange={(checked) => toggleStudent(student.id, checked === true)}
                            aria-label={`Отсутствует: ${student.fullName}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                'block text-sm font-medium',
                                isAbsent ? 'text-strong' : 'text-strong',
                              )}
                            >
                              {student.fullName}
                            </span>
                            <span className="block text-[11px] text-muted">
                              {student.cardNumber}
                              {isOptOut ? ' · не обедает постоянно' : ''}
                            </span>
                          </span>
                          {isOptOut ? (
                            <Badge tone="amber">Не обедает</Badge>
                          ) : isAbsent ? (
                            <Badge tone="danger" dot>
                              Отсутствует
                            </Badge>
                          ) : (
                            <Badge tone="success" dot>
                              Присутствует
                            </Badge>
                          )}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 self-start">
            <Card>
              <CardHeader>
                <CardTitle>Итого для прогноза</CardTitle>
                <Users className="h-4 w-4 text-subtle" />
              </CardHeader>
              <CardContent className="space-y-2 pt-2 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-app px-3 py-2">
                  <span className="text-muted">Учеников в классе</span>
                  <span className="font-semibold text-strong">{formatNumber(stats.total)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2">
                  <span className="text-amber-300">Постоянные отказники</span>
                  <span className="font-semibold text-amber-300">{formatNumber(stats.optOuts)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-red-500/10 px-3 py-2">
                  <span className="text-red-300">Отсутствуют</span>
                  <span className="font-semibold text-red-300">{formatNumber(stats.absent)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2">
                  <span className="text-emerald-300">Нужно порций</span>
                  <span className="font-semibold text-emerald-300">{formatNumber(stats.present)}</span>
                </div>
                <p className="pt-1 text-[11px] text-muted">
                  Порции с буфером школы добавляются в заявке автоматически.
                </p>
              </CardContent>
            </Card>

            <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-elevated/70 p-3.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <p className="text-[11px] text-muted">
                Если ученик не обедает постоянно, снимите отметку «Обедает» в карточке класса — он не будет
                учитываться в прогнозе.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Статус отметки</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-subtle" />
              </CardHeader>
              <CardContent className="pt-2">
                {marked ? (
                  <p className="text-xs text-muted">
                    Отметка сохранена {data.submittedAt}
                    {data.submittedByName ? ` · ${data.submittedByName}` : ''}. Можно изменить и сохранить ещё
                    раз.
                  </p>
                ) : (
                  <p className="flex items-start gap-2 text-xs text-amber-300">
                    <UserRoundX className="mt-0.5 h-4 w-4 shrink-0" />
                    Класс ещё не отмечен. Заявка использует последнюю доступную отметку.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="sticky bottom-16 z-10 mt-4 lg:bottom-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/95 p-3 shadow-lg backdrop-blur">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-strong">
              {dirty ? 'Есть несохранённые изменения' : 'Изменений нет'}
            </p>
            <p className="text-[11px] text-muted">
              {formatNumber(stats.present)} придут · {formatNumber(stats.absent)} отсутствуют ·{' '}
              {formatNumber(stats.optOuts)} не обедают
            </p>
          </div>
          <Button onClick={handleSave} loading={save.isPending} disabled={!dirty}>
            <Save className="h-4 w-4" />
            Сохранить отметку
          </Button>
        </div>
      </div>
    </>
  )
}
