import { useMemo, useState } from 'react'
import { CalendarDays, Download, DoorOpen, LogIn, LogOut, Printer, ShieldCheck, Users } from 'lucide-react'
import { useAccessEvents, useSchool } from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { Input, Select } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { StatCard } from '@/shared/ui/stat-card'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { downloadCsv, printPage } from '@/shared/lib/csv'
import { addDaysISO, formatDate, todayISO } from '@/shared/lib/date'
import { formatNumber } from '@/shared/lib/format'
import { ACCESS_SOURCE_LABELS, ACCESS_TYPE_LABELS } from '@/shared/lib/labels'

export default function GuardLogPage() {
  const user = useSession((state) => state.user)
  const [date, setDate] = useState(todayISO())
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  const schoolQuery = useSchool(user?.schoolId)
  const eventsQuery = useAccessEvents(user?.schoolId, date)

  const events = useMemo(() => eventsQuery.data || [], [eventsQuery.data])

  const filtered = useMemo(
    () =>
      events.filter(
        (event) =>
          (!typeFilter || event.type === typeFilter) &&
          (!sourceFilter || event.source === sourceFilter),
      ),
    [events, sourceFilter, typeFilter],
  )

  const totals = useMemo(() => {
    const entries = events.filter((event) => event.type === 'entry').length
    return {
      entries,
      exits: events.length - entries,
      manual: events.filter((event) => event.source === 'manual').length,
      unique: new Set(events.filter((event) => event.type === 'entry').map((event) => event.studentId)).size,
    }
  }, [events])

  if (schoolQuery.isLoading || eventsQuery.isLoading) return <PageSkeleton />
  if (schoolQuery.isError || eventsQuery.isError) {
    return (
      <ErrorState
        description={(schoolQuery.error || eventsQuery.error)?.message}
        onRetry={() => {
          schoolQuery.refetch()
          eventsQuery.refetch()
        }}
      />
    )
  }

  const handleExport = () => {
    downloadCsv(
      `журнал-скуд-${date}.csv`,
      ['Дата', 'Время', 'Ученик', 'Класс', 'Событие', 'Источник'],
      filtered.map((event) => [
        event.date,
        event.time,
        event.studentName,
        event.className,
        ACCESS_TYPE_LABELS[event.type],
        ACCESS_SOURCE_LABELS[event.source],
      ]),
    )
  }

  return (
    <>
      <div className="print-only mb-4">
        <p className="text-lg font-semibold">{schoolQuery.data?.name}</p>
        <p className="text-sm">Журнал СКУД · {formatDate(date, 'd MMMM yyyy')}</p>
      </div>

      <PageHeader
        eyebrow="Охрана / СКУД"
        title="Журнал проходов"
        description="Все входы и выходы, включая ручные отметки охраны."
        actions={
          <>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <Input
                type="date"
                value={date}
                min={addDaysISO(todayISO(), -30)}
                max={todayISO()}
                onChange={(event) => setDate(event.target.value || todayISO())}
                className="w-[170px] pl-9"
              />
            </div>
            <Button variant="outline" onClick={handleExport} disabled={!filtered.length}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={printPage}>
              <Printer className="h-4 w-4" />
              Печать
            </Button>
          </>
        }
      />

      <div className="print-area">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Входов" value={formatNumber(totals.entries)} hint="за выбранный день" icon={LogIn} tone="emerald" />
          <StatCard label="Выходов" value={formatNumber(totals.exits)} hint="за выбранный день" icon={LogOut} tone="brand" />
          <StatCard label="Ручных отметок" value={formatNumber(totals.manual)} hint="охраной вручную" icon={ShieldCheck} tone="amber" />
          <StatCard label="Учеников" value={formatNumber(totals.unique)} hint="уникальных входов" icon={Users} tone="sky" />
        </div>

        <Card className="mt-4 overflow-hidden">
          <CardHeader className="gap-3">
            <div>
              <CardTitle>События за {formatDate(date, 'd MMMM')}</CardTitle>
              <p className="mt-1 text-xs text-muted">
                {formatNumber(filtered.length)} из {formatNumber(events.length)} событий
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="w-36">
                <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                  <option value="">Все события</option>
                  <option value="entry">Вход</option>
                  <option value="exit">Выход</option>
                </Select>
              </div>
              <div className="w-40">
                <Select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
                  <option value="">Все источники</option>
                  <option value="turnstile">Турникет</option>
                  <option value="manual">Вручную</option>
                </Select>
              </div>
            </div>
          </CardHeader>

          {!filtered.length ? (
            <EmptyState
              icon={DoorOpen}
              title="Событий нет"
              description="За выбранный день проходов не зафиксировано."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Время</TH>
                  <TH>Ученик</TH>
                  <TH>Класс</TH>
                  <TH>Событие</TH>
                  <TH>Источник</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((event) => (
                  <TR key={event.id}>
                    <TD className="font-medium text-strong">{event.time}</TD>
                    <TD>{event.studentName}</TD>
                    <TD>
                      <Badge tone="neutral">{event.className}</Badge>
                    </TD>
                    <TD>
                      <Badge tone={event.type === 'entry' ? 'success' : 'warning'} dot>
                        {ACCESS_TYPE_LABELS[event.type]}
                      </Badge>
                    </TD>
                    <TD className="text-xs text-muted">{ACCESS_SOURCE_LABELS[event.source]}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  )
}
