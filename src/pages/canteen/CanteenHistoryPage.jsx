import { useMemo } from 'react'
import { Download, Printer, Receipt, TrendingDown, Utensils, Wallet } from 'lucide-react'
import { useCanteenSales, useForecastHistory } from '@/api/hooks'
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
import { formatDateShort, relativeDayLabel } from '@/shared/lib/date'
import { formatMoney, formatNumber, formatPercent } from '@/shared/lib/format'

export default function CanteenHistoryPage() {
  const user = useSession((state) => state.user)
  const salesQuery = useCanteenSales(user?.schoolId, 14)
  const forecastQuery = useForecastHistory(user?.schoolId, 14)

  const sales = useMemo(() => salesQuery.data || [], [salesQuery.data])
  const forecast = useMemo(() => forecastQuery.data || [], [forecastQuery.data])

  const totals = useMemo(
    () =>
      sales.reduce(
        (acc, day) => ({
          qty: acc.qty + day.totalQty,
          revenue: acc.revenue + day.revenue,
          waste: acc.waste + day.wasteQty,
        }),
        { qty: 0, revenue: 0, waste: 0 },
      ),
    [sales],
  )

  const wasteCost = useMemo(
    () => forecast.reduce((sum, row) => sum + row.wasteCost, 0),
    [forecast],
  )

  if (salesQuery.isLoading || forecastQuery.isLoading) return <PageSkeleton />
  if (salesQuery.isError || forecastQuery.isError) {
    return (
      <ErrorState
        description={(salesQuery.error || forecastQuery.error)?.message}
        onRetry={() => {
          salesQuery.refetch()
          forecastQuery.refetch()
        }}
      />
    )
  }

  const wasteData = sales.map((day) => ({
    date: day.date,
    wastePortions: day.wasteQty,
  }))

  const handleExport = () => {
    downloadCsv(
      `история-шведский-стол-${user?.schoolId}.csv`,
      ['Дата', 'Продано, ед.', 'Выручка, BYN', 'Списание, ед.', 'Доля списаний, %'],
      sales.map((day) => [
        day.date,
        day.totalQty,
        day.revenue,
        day.wasteQty,
        day.totalQty ? Math.round((day.wasteQty / day.totalQty) * 1000) / 10 : 0,
      ]),
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="КШП / столовая"
        title="История"
        description="Фактические продажи, списания и точность прогноза за последние 14 дней."
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
            label="Продано за период"
            value={formatNumber(totals.qty)}
            hint={`за ${sales.length} дней`}
            icon={Utensils}
            tone="sky"
          />
          <StatCard
            label="Выручка"
            value={formatMoney(totals.revenue)}
            hint="фактические продажи"
            icon={Wallet}
            tone="emerald"
          />
          <StatCard
            label="Списано"
            value={formatNumber(totals.waste)}
            hint={totals.qty ? `${formatPercent((totals.waste / totals.qty) * 100, 1)} от продаж` : '—'}
            icon={TrendingDown}
            tone="amber"
          />
          <StatCard
            label="Стоимость списаний"
            value={formatMoney(wasteCost)}
            hint="оценка по истории прогноза"
            icon={Receipt}
            tone="red"
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Прогноз и фактический расход</CardTitle>
                <p className="mt-1 text-xs text-muted">По всем категориям шведского стола</p>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ForecastChart data={forecast} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Списания по дням</CardTitle>
                <p className="mt-1 text-xs text-muted">Неразобранные позиции по итогам дня</p>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <WasteChart data={wasteData} />
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4 overflow-hidden">
          <CardHeader>
            <CardTitle>Продажи по дням</CardTitle>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>Дата</TH>
                <TH>Продано</TH>
                <TH>Выручка</TH>
                <TH>Списание</TH>
                <TH>Доля списаний</TH>
                <TH>Категории дня</TH>
              </TR>
            </THead>
            <TBody>
              {[...sales].reverse().map((day) => {
                const rate = day.totalQty ? day.wasteQty / day.totalQty : 0
                return (
                  <TR key={day.date}>
                    <TD className="font-medium text-strong">
                      {formatDateShort(day.date)}
                      <span className="ml-1.5 text-[11px] font-normal text-subtle">
                        {relativeDayLabel(day.date)}
                      </span>
                    </TD>
                    <TD>{formatNumber(day.totalQty)}</TD>
                    <TD>{formatMoney(day.revenue)}</TD>
                    <TD>{formatNumber(day.wasteQty)}</TD>
                    <TD>
                      <Badge tone={rate > 0.1 ? 'warning' : 'success'}>{formatPercent(rate * 100, 1)}</Badge>
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        {(day.byCategory || []).map((category) => (
                          <span
                            key={category.id}
                            className="rounded-md bg-elevated px-1.5 py-0.5 text-[10px] text-muted"
                          >
                            {category.name}: {formatNumber(category.qty)}
                          </span>
                        ))}
                      </div>
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        </Card>
      </div>
    </>
  )
}
