import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  DoorOpen,
  DoorClosed,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import {
  useAccessEvents,
  useManualAccessEvent,
  useSchool,
  useSchoolStudents,
} from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { StatCard } from '@/shared/ui/stat-card'
import { useToast } from '@/shared/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { formatDate, todayISO } from '@/shared/lib/date'
import { formatNumber } from '@/shared/lib/format'
import { ACCESS_SOURCE_LABELS, ACCESS_TYPE_LABELS } from '@/shared/lib/labels'

export default function GuardPage() {
  const user = useSession((state) => state.user)
  const schoolId = user?.schoolId
  const today = todayISO()

  const schoolQuery = useSchool(schoolId)
  const eventsQuery = useAccessEvents(schoolId, today)
  const manual = useManualAccessEvent(schoolId)
  const { toast } = useToast()

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [type, setType] = useState('entry')

  const studentsQuery = useSchoolStudents(schoolId, query.trim())

  const results = useMemo(() => {
    if (query.trim().length < 2) return []
    return (studentsQuery.data || []).slice(0, 8)
  }, [query, studentsQuery.data])

  const events = useMemo(() => eventsQuery.data || [], [eventsQuery.data])
  const totals = useMemo(() => {
    const entries = events.filter((event) => event.type === 'entry')
    const manualEvents = events.filter((event) => event.source === 'manual')
    return {
      entries: entries.length,
      exits: events.length - entries.length,
      manual: manualEvents.length,
      unique: new Set(entries.map((event) => event.studentId)).size,
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

  const school = schoolQuery.data

  const handleSubmit = async () => {
    if (!selected) return
    try {
      await manual.mutateAsync({ studentId: selected.id, type })
      toast({
        title: type === 'entry' ? 'Вход отмечен' : 'Выход отмечен',
        description: `${selected.fullName} · ${selected.className}`,
        variant: 'success',
      })
      setSelected(null)
      setQuery('')
    } catch (error) {
      toast({ title: 'Не удалось отметить', description: error.message, variant: 'error' })
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Охрана / СКУД"
        title="Отметка входа"
        description={`${school.name} · ${formatDate(today, 'd MMMM, EEEE')}. Найдите ученика по фамилии и отметьте проход вручную, если турникет не сработал.`}
        actions={
          <Badge tone="info" dot>
            Демо СКУД
          </Badge>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Входов сегодня" value={formatNumber(totals.entries)} hint="по турникету и вручную" icon={DoorOpen} tone="emerald" />
        <StatCard label="Выходов" value={formatNumber(totals.exits)} hint="за текущий день" icon={DoorClosed} tone="brand" />
        <StatCard label="Ручных отметок" value={formatNumber(totals.manual)} hint="через охрану" icon={ShieldCheck} tone="amber" />
        <StatCard label="Учеников прошло" value={formatNumber(totals.unique)} hint="уникальных входов" icon={Users} tone="sky" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Найти ученика</CardTitle>
              <p className="mt-1 text-xs text-muted">Введите минимум 2 символа фамилии</p>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setSelected(null)
                }}
                placeholder="Например: Соколов"
                className="pl-9"
                autoFocus
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setSelected(null)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-subtle hover:bg-elevated"
                  aria-label="Очистить"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="mt-3">
              {query.trim().length < 2 ? (
                <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center">
                  <UserRound className="mx-auto h-8 w-8 text-faint" />
                  <p className="mt-2 text-xs text-muted">
                    Начните вводить фамилию — покажем учеников школы.
                  </p>
                </div>
              ) : studentsQuery.isLoading ? (
                <p className="py-6 text-center text-xs text-muted">Поиск…</p>
              ) : !results.length ? (
                <EmptyState
                  icon={UserRound}
                  title="Ученик не найден"
                  description="Проверьте написание фамилии или обратитесь к завучу."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {results.map((student) => (
                    <li key={student.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(student)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors',
                          selected?.id === student.id ? 'bg-brand-50' : 'hover:bg-elevated',
                        )}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-muted">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-strong">
                            {student.fullName}
                          </span>
                          <span className="block text-[11px] text-muted">
                            {student.className} · {student.cardNumber}
                          </span>
                        </span>
                        {student.mealStatus === 'optOut' ? (
                          <Badge tone="amber">Не обедает</Badge>
                        ) : (
                          <ArrowRight className="h-4 w-4 text-faint" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selected ? (
              <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50/60 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-brand-700">Выбран ученик</p>
                <p className="mt-1 text-sm font-semibold text-strong">{selected.fullName}</p>
                <p className="text-[11px] text-muted">
                  {selected.className} · карта {selected.cardNumber}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('entry')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                      type === 'entry'
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : 'border-line bg-surface text-muted hover:bg-elevated',
                    )}
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Вход
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('exit')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                      type === 'exit'
                        ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                        : 'border-line bg-surface text-muted hover:bg-elevated',
                    )}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Выход
                  </button>
                </div>

                <Button className="mt-2 w-full" onClick={handleSubmit} loading={manual.isPending}>
                  <CheckCircle2 className="h-4 w-4" />
                  Отметить {type === 'entry' ? 'вход' : 'выход'}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Последние события</CardTitle>
              <p className="mt-1 text-xs text-muted">Сегодня · обновляется после ручной отметки</p>
            </div>
            <Badge tone="neutral">{formatNumber(events.length)}</Badge>
          </CardHeader>
          <CardContent className="pt-1">
            {!events.length ? (
              <EmptyState
                icon={DoorOpen}
                title="Событий пока нет"
                description="Отметьте вход вручную — событие появится в журнале."
              />
            ) : (
              <ul className="divide-y divide-line">
                {events.slice(0, 12).map((event) => (
                  <li key={event.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        event.type === 'entry'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400',
                      )}
                    >
                      {event.type === 'entry' ? (
                        <LogIn className="h-4 w-4" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-strong">{event.studentName}</p>
                      <p className="truncate text-[11px] text-muted">
                        {event.className} · {ACCESS_TYPE_LABELS[event.type]} ·{' '}
                        {ACCESS_SOURCE_LABELS[event.source]}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted">{event.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
