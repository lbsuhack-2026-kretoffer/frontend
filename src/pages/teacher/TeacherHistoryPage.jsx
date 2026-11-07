import { useMemo, useState } from 'react'
import { CalendarCheck2, CheckCircle2, ClipboardList, History, UserX, Users } from 'lucide-react'
import { useMyAttendanceHistory } from '@/api/hooks'
import { Badge } from '@/shared/ui/badge'
import { Card, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { PageHeader } from '@/shared/ui/page-header'
import { Select } from '@/shared/ui/input'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { StatCard } from '@/shared/ui/stat-card'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { formatDate, formatTime, relativeDayLabel } from '@/shared/lib/date'
import { formatNumber, formatPercent } from '@/shared/lib/format'

export default function TeacherHistoryPage() {
  const query = useMyAttendanceHistory(14)
  const [classFilter, setClassFilter] = useState('')

  const items = useMemo(() => query.data?.items || [], [query.data?.items])

  const safeItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        absent: item.absentCount ?? 0,
        students: item.students ?? 0,
        optOuts: item.optOuts ?? 0,
        present: item.present ?? Math.max((item.students ?? 0) - (item.absentCount ?? 0), 0),
        submittedByName: item.submittedByName ?? null,
      })),
    [items],
  )

  const classOptions = useMemo(() => {
    const map = new Map()
    for (const item of safeItems) map.set(item.classId, item.className)
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [safeItems])

  const filtered = useMemo(() => {
    if (!classFilter) return safeItems
    return safeItems.filter((item) => item.classId === classFilter)
  }, [safeItems, classFilter])

  const totals = useMemo(() => {
    const dates = new Set(safeItems.map((item) => item.date))
    const present = safeItems.reduce((sum, item) => sum + item.present, 0)
    const absent = safeItems.reduce((sum, item) => sum + item.absent, 0)
    const possible = safeItems.reduce((sum, item) => sum + item.students - item.optOuts, 0)
    return {
      marks: safeItems.length,
      dates: dates.size,
      present,
      absent,
      rate: possible ? present / possible : 0,
    }
  }, [safeItems])

  if (query.isLoading) return <PageSkeleton />
  if (query.isError) {
    return <ErrorState description={query.error.message} onRetry={query.refetch} />
  }

  return (
    <>
      <PageHeader
        eyebrow="Учитель"
        title="История отметок"
        description={`Последние ${query.data?.days || 14} дней: сохранённые отметки по вашим классам.`}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Сохранённых отметок"
          value={formatNumber(totals.marks)}
          hint={`${formatNumber(totals.dates)} учебных дней`}
          icon={ClipboardList}
          tone="brand"
        />
        <StatCard
          label="Посещаемость"
          value={formatPercent(totals.rate * 100, 1)}
          hint="от числа обедающих"
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Присутствовали"
          value={formatNumber(totals.present)}
          hint="суммарно по отметкам"
          icon={Users}
          tone="sky"
        />
        <StatCard
          label="Отсутствовали"
          value={formatNumber(totals.absent)}
          hint="суммарно по отметкам"
          icon={UserX}
          tone="amber"
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="gap-3">
          <div>
            <CardTitle>Отметки по дням</CardTitle>
            <p className="mt-1 text-xs text-muted">Каждая строка — сохранённая отметка класса</p>
          </div>
          <div className="w-full sm:w-56">
            <Select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="">Все классы</option>
              {classOptions.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>

        {!filtered.length ? (
          <EmptyState
            icon={History}
            title="Отметок пока нет"
            description="Сохранённые отметки появятся здесь."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Дата</TH>
                <TH>Класс</TH>
                <TH>Ученики</TH>
                <TH>Не обедают</TH>
                <TH>Отсутствовали</TH>
                <TH>Присутствовали</TH>
                <TH>Сохранено</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((item) => (
                <TR key={item.id}>
                  <TD className="font-medium text-strong">
                    {formatDate(item.date, 'd MMM')}
                    <span className="ml-1.5 text-[11px] font-normal text-subtle">
                      {relativeDayLabel(item.date)}
                    </span>
                  </TD>
                  <TD>
                    <Badge tone="neutral">{item.className}</Badge>
                  </TD>
                  <TD>{formatNumber(item.students)}</TD>
                  <TD>{formatNumber(item.optOuts)}</TD>
                  <TD className="text-red-400">{formatNumber(item.absent)}</TD>
                  <TD className="font-medium text-emerald-300">{formatNumber(item.present)}</TD>
                  <TD>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <CalendarCheck2 className="h-3.5 w-3.5 text-subtle" />
                      {formatTime(item.submittedAt)}
                      {item.submittedByName ? (
                        <span className="hidden text-subtle sm:inline">· {item.submittedByName}</span>
                      ) : null}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  )
}
