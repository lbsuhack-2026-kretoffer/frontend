import { useMemo } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Info,
  UserX,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMyClasses } from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { Badge } from '@/shared/ui/badge'
import { buttonStyles } from '@/shared/ui/button-styles'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { PageHeader } from '@/shared/ui/page-header'
import { Progress } from '@/shared/ui/progress'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { StatCard } from '@/shared/ui/stat-card'
import { formatDate, todayISO } from '@/shared/lib/date'
import { formatNumber, studentsLabel } from '@/shared/lib/format'
import { AGE_GROUP_LABELS, AGE_GROUP_TONE } from '@/shared/lib/labels'

function currentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export default function TeacherHomePage() {
  const user = useSession((state) => state.user)
  const today = todayISO()
  const query = useMyClasses(today)

  const data = query.data
  const classes = useMemo(() => data?.classes || [], [data?.classes])

  const totals = useMemo(() => {
    return classes.reduce(
      (acc, cls) => ({
        students: acc.students + cls.students,
        present: acc.present + cls.present,
        absent: acc.absent + cls.absent,
        marked: acc.marked + (cls.status === 'marked' ? 1 : 0),
      }),
      { students: 0, present: 0, absent: 0, marked: 0 },
    )
  }, [classes])

  if (query.isLoading) return <PageSkeleton />
  if (query.isError) {
    return <ErrorState description={query.error.message} onRetry={query.refetch} />
  }

  const unmarked = classes.filter((cls) => cls.status === 'unmarked')
  const deadline = data?.deadline || '09:30'
  const overdue = currentTime() > deadline
  const firstName = user?.fullName?.split(' ')[1] || user?.fullName || ''

  return (
    <>
      <PageHeader
        eyebrow={data?.schoolName}
        title={`Здравствуйте, ${firstName}`}
        description={`${formatDate(today, 'd MMMM, EEEE')} · дедлайн отметки ${deadline}`}
        actions={
          <Link to="/teacher/history" className={buttonStyles({ variant: 'outline', size: 'md' })}>
            История отметок
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Мои классы"
          value={formatNumber(classes.length)}
          hint={studentsLabel(totals.students)}
          icon={Users}
          tone="brand"
        />
        <StatCard
          label="Отмечено сегодня"
          value={`${totals.marked} / ${classes.length}`}
          hint={unmarked.length ? `осталось ${unmarked.length}` : 'все классы отмечены'}
          icon={ClipboardCheck}
          tone={unmarked.length ? 'amber' : 'emerald'}
        />
        <StatCard
          label="Присутствуют"
          value={formatNumber(totals.present)}
          hint="по текущим отметкам"
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Отсутствуют"
          value={formatNumber(totals.absent)}
          hint="только по сохранённым отметкам"
          icon={UserX}
          tone="amber"
        />
      </div>

      {unmarked.length ? (
        <div
          className={`mt-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 ${
            overdue ? 'border-red-500/30 bg-red-500/10' : 'border-amber-500/30 bg-amber-500/10'
          }`}
        >
          <AlertTriangle className={`h-5 w-5 shrink-0 ${overdue ? 'text-red-400' : 'text-amber-400'}`} />
          <p className={`min-w-0 flex-1 text-xs ${overdue ? 'text-red-200' : 'text-amber-200'}`}>
            {overdue ? 'Дедлайн прошёл. ' : 'Напоминание. '}
            Не отмечены:{' '}
            <span className="font-semibold">{unmarked.map((cls) => cls.name).join(', ')}</span>. Отметьте
            отсутствующих — это влияет на заявку в столовую на завтра.
          </p>
          <Link
            to={`/teacher/attendance/${unmarked[0].id}`}
            className={`text-xs font-semibold underline underline-offset-2 ${
              overdue ? 'text-red-200' : 'text-amber-200'
            }`}
          >
            Отметить сейчас
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <p className="text-xs text-emerald-200">
            Все ваши классы отмечены. Заявка на завтра сформирована с учётом посещаемости.
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Мои классы</CardTitle>
              <p className="mt-1 text-xs text-muted">
                Отметьте отсутствующих на первом уроке — это займёт пару минут
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {!classes.length ? (
              <EmptyState
                icon={Users}
                title="Классы не назначены"
                description="Обратитесь к завучу, чтобы вам закрепили класс."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {classes.map((cls) => {
                  const marked = cls.status === 'marked'
                  const rate = cls.students ? Math.round((cls.present / cls.students) * 100) : 0
                  return (
                    <div key={cls.id} className="rounded-2xl border border-line p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-strong">{cls.name}</p>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {studentsLabel(cls.students)} · не обедают {cls.optOuts}
                          </p>
                        </div>
                        <Badge tone={AGE_GROUP_TONE[cls.ageGroup]}>{AGE_GROUP_LABELS[cls.ageGroup]}</Badge>
                      </div>

                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <p className="text-xs text-muted">Присутствуют</p>
                          <p className="text-xl font-semibold text-strong">
                            {formatNumber(cls.present)}
                            <span className="ml-1 text-xs font-normal text-subtle">
                              / {formatNumber(cls.students)}
                            </span>
                          </p>
                        </div>
                        <Badge tone={marked ? 'success' : 'warning'} dot>
                          {marked ? 'Отмечен' : 'Не отмечен'}
                        </Badge>
                      </div>

                      <Progress
                        value={rate}
                        tone={marked ? 'emerald' : 'amber'}
                        className="mt-2"
                      />

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-muted">
                          {marked
                            ? `${formatNumber(cls.absent)} отсутствуют${
                                cls.submittedAt ? ` · ${cls.submittedAt}` : ''
                              }`
                            : `до дедлайна ${deadline}`}
                        </p>
                        <Link
                          to={`/teacher/attendance/${cls.id}`}
                          className={buttonStyles({
                            variant: marked ? 'outline' : 'primary',
                            size: 'sm',
                          })}
                        >
                          {marked ? 'Изменить' : 'Отметить'}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Как это работает</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-xs text-muted">
              {[
                'Отметьте отсутствующих в каждом своём классе на первом уроке.',
                'Постоянные отказники уже исключены из расчёта порций.',
                'Завуч и КШП видят актуальную заявку на завтра с буфером.',
              ].map((text, index) => (
                <div key={text} className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700">
                    {index + 1}
                  </span>
                  <p>{text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Дедлайн</CardTitle>
              <Clock className="h-4 w-4 text-subtle" />
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-2xl font-semibold text-strong">{deadline}</p>
              <p className="mt-1 text-[11px] text-muted">
                {overdue
                  ? 'Время прошло — отметки всё ещё принимаются, но могут потребовать ручной проверки завучем.'
                  : 'После дедлайна отметки считаются опоздавшими.'}
              </p>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-elevated/70 p-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <p className="text-[11px] text-muted">
              Демо-режим: данные хранятся в браузере и сбрасываются при обновлении демо-стенда.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
