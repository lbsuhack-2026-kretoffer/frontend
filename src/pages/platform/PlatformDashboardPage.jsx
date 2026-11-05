import { Activity, ArrowRight, Building2, GraduationCap, School, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePlatformSchools, usePlatformStats } from '@/api/hooks'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { PageHeader } from '@/shared/ui/page-header'
import { Progress } from '@/shared/ui/progress'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { StatCard } from '@/shared/ui/stat-card'
import { buttonStyles } from '@/shared/ui/button-styles'
import { formatNumber, studentsLabel } from '@/shared/lib/format'
import { MEAL_PLAN_LABELS } from '@/shared/lib/labels'

export default function PlatformDashboardPage() {
  const stats = usePlatformStats()
  const schools = usePlatformSchools({ pageSize: 4 })

  if (stats.isLoading) return <PageSkeleton />
  if (stats.isError) {
    return <ErrorState description={stats.error.message} onRetry={stats.refetch} />
  }

  const data = stats.data
  const markedPercent = data.attendance.totalClasses
    ? Math.round((data.attendance.markedClasses / data.attendance.totalClasses) * 100)
    : 0

  return (
    <>
      <PageHeader
        eyebrow="Платформа"
        title="Обзор"
        description="Сводная картина по подключённым школам: ученики, классы и готовность данных к прогнозу."
        actions={
          <Link to="/platform/schools" className={buttonStyles({ variant: 'primary', size: 'md' })}>
            <School className="h-4 w-4" />
            Все школы
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Школы"
          value={formatNumber(data.schools)}
          hint={`${data.activeSchools} с активным доступом`}
          icon={Building2}
          tone="brand"
        />
        <StatCard
          label="Ученики"
          value={formatNumber(data.students)}
          hint="во всех школах платформы"
          icon={Users}
          tone="sky"
        />
        <StatCard
          label="Классы"
          value={formatNumber(data.classes)}
          hint={`${formatNumber(data.teachers)} учителей`}
          icon={GraduationCap}
          tone="violet"
        />
        <StatCard
          label="Посещаемость сегодня"
          value={formatNumber(data.attendance.present)}
          hint={`${formatNumber(data.attendance.absent)} отсутствуют · ${formatNumber(data.attendance.optOuts)} не обедают`}
          icon={Activity}
          tone="emerald"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Школы на платформе</CardTitle>
              <p className="mt-1 text-xs text-muted">Быстрый переход в карточку школы</p>
            </div>
            <Link to="/platform/schools" className="text-xs font-semibold text-brand-700 hover:underline">
              Открыть список
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {schools.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl bg-elevated" />
                ))}
              </div>
            ) : schools.isError ? (
              <ErrorState description={schools.error.message} onRetry={schools.refetch} />
            ) : !schools.data?.items?.length ? (
              <EmptyState title="Школ пока нет" description="Добавьте первую школу на платформе." />
            ) : (
              <div className="divide-y divide-line">
                {schools.data.items.map((school) => (
                  <Link
                    key={school.id}
                    to={`/platform/schools/${school.id}`}
                    className="flex items-center gap-3 py-3 transition-colors hover:bg-elevated/70"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <School className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-strong">{school.name}</p>
                      <p className="truncate text-[11px] text-muted">
                        {school.city} · {MEAL_PLAN_LABELS[school.mealPlan]} · {studentsLabel(school.studentsCount)}
                      </p>
                    </div>
                    <Badge tone={school.accessEnabled ? 'success' : 'danger'} dot>
                      {school.accessEnabled ? 'Активна' : 'Заблокирована'}
                    </Badge>
                    <ArrowRight className="h-4 w-4 shrink-0 text-faint" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Готовность данных</CardTitle>
              <Badge tone={markedPercent === 100 ? 'success' : 'warning'}>
                {formatNumber(data.attendance.markedClasses)} из {formatNumber(data.attendance.totalClasses)}
              </Badge>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="text-3xl font-semibold tracking-tight text-strong">{markedPercent}%</p>
              <p className="mt-1 text-xs text-muted">
                классов отметили отсутствующих сегодня. Чем выше показатель, тем точнее заявка на завтра.
              </p>
              <Progress value={markedPercent} tone={markedPercent === 100 ? 'emerald' : 'amber'} className="mt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Структура ролей</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              {[
                { label: 'Завучи', value: schools.data?.items?.reduce((sum, item) => sum + (item.admins?.length || 0), 0) || 0 },
                { label: 'Учителя', value: data.teachers },
                { label: 'Классы', value: data.classes },
                { label: 'Не обедают', value: data.attendance.optOuts },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg bg-app px-3 py-2">
                  <span className="text-xs text-muted">{row.label}</span>
                  <span className="text-xs font-semibold text-strong">{formatNumber(row.value)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
