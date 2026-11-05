import { useMemo } from 'react'
import { AlertTriangle, BarChart3, Download, Printer, Target, Trash2, TrendingDown } from 'lucide-react'
import { useForecastHistory, useSchool } from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { ForecastChart, WasteChart } from '@/features/charts/Charts'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { ErrorState } from '@/shared/ui/empty-state'
import { PageHeader } from '@/shared/ui/page-header'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { StatCard } from '@/shared/ui/stat-card'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { downloadCsv, printPage } from '@/shared/lib/csv'
import { formatDateShort, relativeDayLabel, todayISO } from '@/shared/lib/date'
import { formatMoney, formatNumber, formatPercent } from '@/shared/lib/format'

function accuracyTone(accuracy) {
  if (accuracy >= 0.94) return 'success'
  if (accuracy >= 0.89) return 'warning'
  return 'danger'
}

export default function SchoolReportsPage() {
  const user = useSession((state) => state.user)
  const schoolQuery = useSchool(user?.schoolId)
  const historyQuery = useForecastHistory(user?.schoolId)

  const rows = useMemo(() => historyQuery.data || [], [historyQuery.data])

  const totals = useMemo(() => {
    if (!rows.length) {
      return { accuracy: 0, waste: 0, wasteCost: 0, forecast: 0, actual: 0 }
    }
    const accuracy = rows.reduce((sum, row) => sum + row.accuracy, 0) / rows.length
    return {
      accuracy,
      waste: rows.reduce((sum, row) => sum + row.wastePortions, 0),
      wasteCost: rows.reduce((sum, row) => sum + row.wasteCost, 0),
      forecast: rows.reduce((sum, row) => sum + row.forecast, 0),
      actual: rows.reduce((sum, row) => sum + row.actual, 0),
    }
  }, [rows])

  const worstDay = useMemo(() => {
    if (!rows.length) return null
    return [...rows].sort((a, b) => a.accuracy - b.accuracy)[0]
  }, [rows])

  if (schoolQuery.isLoading || historyQuery.isLoading) return <PageSkeleton />
  if (schoolQuery.isError || historyQuery.isError) {
    return (
      <ErrorState
        description={(schoolQuery.error || historyQuery.error)?.message}
        onRetry={() => {
          schoolQuery.refetch()
          historyQuery.refetch()
        }}
      />
    )
  }

  const school = schoolQuery.data
  const firstDate = rows[0]?.date || todayISO()
  const lastDate = rows[rows.length - 1]?.date || todayISO()

  const handleExport = () => {
    downloadCsv(
      `отчёт-${school.name.replace(/\s+/g, '-')}-${lastDate}.csv`,
      ['Дата', 'Прогноз', 'Факт', 'Списание, порций', 'Стоимость списания, BYN', 'Точность, %'],
      rows.map((row) => [
        row.date,
        row.forecast,
        row.actual,
        row.wastePortions,
        row.wasteCost,
        Math.round(row.accuracy * 100),
      ]),
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Школа"
        title="Отчёты"
        description={`${school.name} · последние ${rows.length} дней · ${formatDateShort(firstDate)} — ${formatDateShort(lastDate)}`}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
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
          <StatCard
            label="Средняя точность"
            value={formatPercent(totals.accuracy * 100, 1)}
            hint="совпадение прогноза и факта"
            icon={Target}
            tone="emerald"
          />
          <StatCard
            label="Прогноз за период"
            value={formatNumber(totals.forecast)}
            hint={`факт: ${formatNumber(totals.actual)}`}
            icon={BarChart3}
            tone="brand"
          />
          <StatCard
            label="Списания"
            value={formatNumber(totals.waste)}
            hint="порций за период"
            icon={Trash2}
            tone="amber"
          />
          <StatCard
            label="Стоимость списаний"
            value={formatMoney(totals.wasteCost)}
            hint={worstDay ? `худший день: ${formatDateShort(worstDay.date)}` : ''}
            icon={TrendingDown}
            tone="red"
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Прогноз и факт</CardTitle>
                <p className="mt-1 text-xs text-muted">Чем ближе линии, тем точнее заявка</p>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ForecastChart data={rows} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Списания по дням</CardTitle>
                <p className="mt-1 text-xs text-muted">Разница между заявкой и фактическим расходом</p>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <WasteChart data={rows} />
            </CardContent>
          </Card>
        </div>

        {worstDay && worstDay.accuracy < 0.9 ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-200">
              {formatDateShort(worstDay.date)} ({relativeDayLabel(worstDay.date)}) точность составила{' '}
              <span className="font-semibold">{formatPercent(worstDay.accuracy * 100)}</span>. Возможная причина —
              неполные отметки классов или внешнее мероприятие. Проверьте историю посещаемости.
            </p>
          </div>
        ) : null}

        <Card className="mt-4 overflow-hidden">
          <CardHeader>
            <CardTitle>Детализация по дням</CardTitle>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>Дата</TH>
                <TH>Прогноз</TH>
                <TH>Факт</TH>
                <TH>Отклонение</TH>
                <TH>Списание</TH>
                <TH>Стоимость</TH>
                <TH>Точность</TH>
              </TR>
            </THead>
            <TBody>
              {[...rows].reverse().map((row) => (
                <TR key={row.date}>
                  <TD className="font-medium text-strong">
                    {formatDateShort(row.date)}
                    <span className="ml-1.5 text-[11px] font-normal text-subtle">
                      {relativeDayLabel(row.date)}
                    </span>
                  </TD>
                  <TD>{formatNumber(row.forecast)}</TD>
                  <TD>{formatNumber(row.actual)}</TD>
                  <TD className={row.forecast > row.actual ? 'text-amber-300' : 'text-muted'}>
                    {row.forecast > row.actual ? '+' : ''}
                    {formatNumber(row.forecast - row.actual)}
                  </TD>
                  <TD>{formatNumber(row.wastePortions)}</TD>
                  <TD>{formatMoney(row.wasteCost)}</TD>
                  <TD>
                    <Badge tone={accuracyTone(row.accuracy)}>{formatPercent(row.accuracy * 100)}</Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </>
  )
}
