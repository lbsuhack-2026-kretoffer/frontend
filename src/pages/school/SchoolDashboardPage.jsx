import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  School as SchoolIcon,
  Utensils,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useAttendanceSummary,
  useForecast,
  useForecastHistory,
  useSchool,
  useSchoolClasses,
} from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { ForecastChart } from '@/features/charts/Charts'
import { Badge } from '@/shared/ui/badge'
import { buttonStyles } from '@/shared/ui/button-styles'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { PageHeader } from '@/shared/ui/page-header'
import { Progress } from '@/shared/ui/progress'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { StatCard } from '@/shared/ui/stat-card'
import { todayISO, tomorrowISO, formatDate, relativeDayLabel } from '@/shared/lib/date'
import { formatNumber, portionsLabel, studentsLabel } from '@/shared/lib/format'
import {
  AGE_GROUP_LABELS,
  AGE_GROUP_TONE,
  FORECAST_STATUS_LABELS,
} from '@/shared/lib/labels'

export default function SchoolDashboardPage() {
  const user = useSession((state) => state.user)
  const schoolId = user?.schoolId
  const today = todayISO()
  const tomorrow = tomorrowISO()

  const schoolQuery = useSchool(schoolId)
  const summaryQuery = useAttendanceSummary(schoolId, today)
  const forecastQuery = useForecast(schoolId, tomorrow)
  const historyQuery = useForecastHistory(schoolId)
  const classesQuery = useSchoolClasses(schoolId, today)

  if (!schoolId) {
    return (
      <ErrorState
        description="Школа не определена для вашего аккаунта. Обратитесь к администратору платформы."
      />
    )
  }

  if (schoolQuery.isLoading || summaryQuery.isLoading || forecastQuery.isLoading) {
    return <PageSkeleton />
  }
  if (schoolQuery.isError || summaryQuery.isError || forecastQuery.isError) {
    return (
      <ErrorState
        description={(schoolQuery.error || summaryQuery.error || forecastQuery.error)?.message}
        onRetry={() => {
          schoolQuery.refetch()
          summaryQuery.refetch()
          forecastQuery.refetch()
        }}
      />
    )
  }

  const school = schoolQuery.data
  if (!school) {
    return <ErrorState description="Школа не найдена" />
  }
  const summary = summaryQuery.data
  const forecast = forecastQuery.data
  const unmarked = (classesQuery.data || []).filter((cls) => !cls.attendance || cls.attendance.status !== 'submitted')
  const markedPercent = summary.totalClasses
    ? Math.round((summary.markedClasses / summary.totalClasses) * 100)
    : 0

  return (
    <>
      <PageHeader
        eyebrow={school.name}
        title="Дашборд школы"
        description={`${formatDate(today, 'd MMMM, EEEE')} · заявка на ${relativeDayLabel(tomorrow)}, ${formatDate(tomorrow, 'd MMMM')}`}
        actions={
          <>
            <Link to="/school/forecast" className={buttonStyles({ variant: 'primary', size: 'md' })}>
              <CalendarClock className="h-4 w-4" />
              Прогноз на завтра
            </Link>
            <Link to="/school/classes" className={buttonStyles({ variant: 'outline', size: 'md' })}>
              Классы
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ученики"
          value={formatNumber(summary.totalStudents)}
          hint={`${formatNumber(summary.optOuts)} не обедают постоянно`}
          icon={SchoolIcon}
          tone="sky"
        />
        <StatCard
          label="Присутствуют сегодня"
          value={formatNumber(summary.present)}
          hint={`${formatNumber(summary.absent)} отсутствуют`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Заявка на завтра"
          value={portionsLabel(forecast.totalPortions)}
          hint={`буфер ${forecast.bufferPercent}% · ${FORECAST_STATUS_LABELS[forecast.status]}`}
          icon={Utensils}
          tone="brand"
        />
        <StatCard
          label="Отмечено классов"
          value={`${summary.markedClasses} / ${summary.totalClasses}`}
          hint={unmarked.length ? `${unmarked.length} без отметки` : 'все классы отметились'}
          icon={ClipboardList}
          tone={unmarked.length ? 'amber' : 'emerald'}
        />
      </div>

      {unmarked.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <p className="min-w-0 flex-1 text-xs text-amber-200">
            Без отметки: <span className="font-semibold">{unmarked.map((cls) => cls.name).join(', ')}</span>. Для
            этих классов прогноз использует последнюю доступную отметку.
          </p>
          <Link to="/school/classes" className="text-xs font-semibold text-amber-200 underline underline-offset-2">
            Проверить классы
          </Link>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Заявка на {relativeDayLabel(tomorrow)}</CardTitle>
              <p className="mt-1 text-xs text-muted">
                {formatDate(tomorrow, 'd MMMM')} · {forecast.mealPlan === 'canteen' ? 'шведский стол' : 'фиксированное питание'}
              </p>
            </div>
            <Badge tone={forecast.status === 'approved' ? 'success' : 'warning'} dot>
              {FORECAST_STATUS_LABELS[forecast.status]}
            </Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-strong">
                  {formatNumber(forecast.totalPortions)}
                </p>
                <p className="text-xs text-muted">порций с буфером {forecast.bufferPercent}%</p>
              </div>
              <div className="flex gap-4 border-l border-line pl-4 text-xs text-muted">
                <div>
                  <p className="font-semibold text-strong">{formatNumber(forecast.present)}</p>
                  присутствуют
                </div>
                <div>
                  <p className="font-semibold text-strong">{formatNumber(forecast.absent)}</p>
                  отсутствуют
                </div>
                <div>
                  <p className="font-semibold text-strong">{formatNumber(forecast.optOuts)}</p>
                  не обедают
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {forecast.byAgeGroup.map((group) => {
                const share = forecast.totalPortions
                  ? Math.round((group.portions / forecast.totalPortions) * 100)
                  : 0
                return (
                  <div key={group.ageGroup}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-body">
                        <Badge tone={AGE_GROUP_TONE[group.ageGroup]} className="px-2 py-0.5">
                          {AGE_GROUP_LABELS[group.ageGroup]}
                        </Badge>
                        <span className="text-subtle">{group.students} уч.</span>
                      </span>
                      <span className="font-semibold text-strong">
                        {formatNumber(group.portions)} <span className="font-normal text-subtle">({share}%)</span>
                      </span>
                    </div>
                    <Progress
                      value={share}
                      tone={group.ageGroup === 'junior' ? 'sky' : group.ageGroup === 'middle' ? 'violet' : 'amber'}
                    />
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-app px-3 py-2 text-[11px] text-muted">
              <span>
                Основано на отметках: {formatDate(forecast.basedOnDate, 'd MMM')} · точность модели{' '}
                {Math.round(forecast.confidence * 100)}%
              </span>
              <Link to="/school/forecast" className="inline-flex items-center gap-1 font-semibold text-brand-700">
                Детали <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Посещаемость сегодня</CardTitle>
              <p className="mt-1 text-xs text-muted">Отметки учителей на первом уроке</p>
            </div>
            <Badge tone={markedPercent === 100 ? 'success' : 'warning'}>{markedPercent}%</Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-end gap-2">
              <p className="text-3xl font-semibold tracking-tight text-strong">{formatNumber(summary.present)}</p>
              <p className="pb-1 text-xs text-muted">из {studentsLabel(summary.totalStudents)}</p>
            </div>
            <Progress value={markedPercent} tone={markedPercent === 100 ? 'emerald' : 'amber'} className="mt-3" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-red-500/10 px-3 py-2">
                <p className="text-lg font-semibold text-red-300">{formatNumber(summary.absent)}</p>
                <p className="text-[11px] text-red-400">отсутствуют</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 px-3 py-2">
                <p className="text-lg font-semibold text-amber-300">{formatNumber(summary.optOuts)}</p>
                <p className="text-[11px] text-amber-300">не обедают</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {(classesQuery.data || []).map((cls) => (
                <div key={cls.id} className="flex items-center justify-between rounded-lg px-1 py-1 text-xs">
                  <span className="flex items-center gap-1.5 text-muted">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${cls.attendance?.status === 'submitted' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    />
                    {cls.name}
                  </span>
                  <span className={cls.attendance?.status === 'submitted' ? 'text-muted' : 'font-medium text-amber-300'}>
                    {cls.attendance?.status === 'submitted' ? `${cls.attendance?.absentCount} придут` : 'не отмечен'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Прогноз и факт за 14 дней</CardTitle>
              <p className="mt-1 text-xs text-muted">Точность растёт по мере накопления отметок</p>
            </div>
            <Link to="/school/reports" className="text-xs font-semibold text-brand-700 hover:underline">
              Отчёты
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {historyQuery.isLoading ? (
              <div className="h-[260px] animate-pulse rounded-xl bg-elevated" />
            ) : historyQuery.isError ? (
              <ErrorState description={historyQuery.error.message} onRetry={historyQuery.refetch} />
            ) : (
              <ForecastChart data={historyQuery.data || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Классы сегодня</CardTitle>
            <Link to="/school/classes" className="text-xs font-semibold text-brand-700 hover:underline">
              Все
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {classesQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-10 animate-pulse rounded-lg bg-elevated" />
                ))}
              </div>
            ) : classesQuery.isError ? (
              <ErrorState description={classesQuery.error.message} onRetry={classesQuery.refetch} />
            ) : !classesQuery.data?.length ? (
              <EmptyState title="Классов нет" />
            ) : (
              <div className="divide-y divide-line">
                {classesQuery.data.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-strong">{cls.name}</p>
                      <p className="truncate text-[11px] text-muted">
                        {cls.teacherNames?.join(', ') || 'Учитель не назначен'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-strong">{formatNumber(cls.attendance?.absentCount || 0)}</p>
                      <p className="text-[10px] text-subtle">отсутствуют</p>
                    </div>
                    <Badge tone={cls.attendance?.status === 'marked' ? 'success' : 'warning'}>
                      {cls.attendance?.status === 'marked' ? 'Отмечен' : 'Нет'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
