import { useMemo, useState } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Info,
  Printer,
  TrendingUp,
  Utensils,
} from 'lucide-react'
import { useApproveForecast, useCanteenForecast, useSchool } from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { CategoryChart } from '@/features/charts/Charts'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Dialog } from '@/shared/ui/dialog'
import { ErrorState } from '@/shared/ui/empty-state'
import { Field, Input, Textarea } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/use-toast'
import { downloadCsv, printPage } from '@/shared/lib/csv'
import { addDaysISO, formatDate, relativeDayLabel, todayISO, tomorrowISO } from '@/shared/lib/date'
import { formatMoney, formatNumber, formatPercent } from '@/shared/lib/format'
import { FORECAST_STATUS_LABELS } from '@/shared/lib/labels'

function ApproveDialog({ open, onOpenChange, date, total, onSubmit, loading }) {
  const [comment, setComment] = useState('')
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Подтвердить заявку"
      description={`${formatDate(date, 'd MMMM')} · ${formatNumber(total)} единиц к приготовлению`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            loading={loading}
            onClick={() => {
              onSubmit(comment)
              setComment('')
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            Подтвердить
          </Button>
        </>
      }
    >
      <Field label="Комментарий" hint="Необязательно: корректировка или причина изменения">
        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Например: завтра экскурсия у 5Б, уменьшили горячее"
        />
      </Field>
    </Dialog>
  )
}

export default function CanteenPage() {
  const user = useSession((state) => state.user)
  const schoolId = user?.schoolId
  const [date, setDate] = useState(tomorrowISO())
  const [approveOpen, setApproveOpen] = useState(false)

  const schoolQuery = useSchool(schoolId)
  const forecastQuery = useCanteenForecast(schoolId, date)
  const approve = useApproveForecast()
  const { toast } = useToast()

  const forecast = forecastQuery.data

  const chartData = useMemo(
    () => (forecast?.categories || []).map((category) => ({ name: category.name, qty: category.qty })),
    [forecast?.categories],
  )

  if (schoolQuery.isLoading || forecastQuery.isLoading) return <PageSkeleton />
  if (schoolQuery.isError || forecastQuery.isError) {
    return (
      <ErrorState
        description={(schoolQuery.error || forecastQuery.error)?.message}
        onRetry={() => {
          schoolQuery.refetch()
          forecastQuery.refetch()
        }}
      />
    )
  }

  const school = schoolQuery.data
  const approved = forecast.status === 'approved'

  const handleApprove = async (comment) => {
    try {
      await approve.mutateAsync({ schoolId, date, comment })
      toast({
        title: 'Заявка подтверждена',
        description: `${formatDate(date, 'd MMMM')} · ${formatNumber(forecast.totalForecastQty)} единиц`,
        variant: 'success',
      })
      setApproveOpen(false)
    } catch (error) {
      toast({ title: 'Не удалось подтвердить заявку', description: error.message, variant: 'error' })
    }
  }

  const handleExport = () => {
    downloadCsv(
      `заявка-кшп-${school.name.replace(/\s+/g, '-')}-${date}.csv`,
      ['Категория', 'Прогноз, ед.', 'Вчера, ед.', 'Списание вчера, ед.', 'Цена, BYN', 'Выручка, BYN'],
      forecast.categories.map((category) => [
        category.name,
        category.qty,
        category.yesterdayQty,
        category.wasteQty,
        category.avgPrice,
        category.revenue,
      ]),
    )
  }

  return (
    <>
      <div className="print-only mb-4">
        <p className="text-lg font-semibold">{school.name}</p>
        <p className="text-sm">
          Заявка КШП на {formatDate(date, 'd MMMM yyyy')} · {formatNumber(forecast.totalForecastQty)} единиц
        </p>
      </div>

      <PageHeader
        eyebrow="КШП / столовая"
        title="Заявка на завтра"
        description={`${school.name} · ${formatDate(date, 'd MMMM, EEEE')} · ${relativeDayLabel(date)}`}
        actions={
          <>
            <div className="relative">
              <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <Input
                type="date"
                value={date}
                min={addDaysISO(todayISO(), -13)}
                max={addDaysISO(todayISO(), 14)}
                onChange={(event) => setDate(event.target.value)}
                className="w-[170px] pl-9"
              />
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={printPage}>
              <Printer className="h-4 w-4" />
              Печать
            </Button>
            <Button onClick={() => setApproveOpen(true)} disabled={approved} loading={approve.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {approved ? 'Подтверждена' : 'Подтвердить'}
            </Button>
          </>
        }
      />

      <div className="print-area">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
            <p className="text-xs text-muted">Всего к приготовлению</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-strong">
              {formatNumber(forecast.totalForecastQty)}
            </p>
            <p className="mt-1 text-xs text-muted">
              буфер {forecast.bufferPercent}% · {FORECAST_STATUS_LABELS[forecast.status]}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
            <p className="text-xs text-muted">Ожидаемая выручка</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-strong">
              {formatMoney(forecast.expectedRevenue)}
            </p>
            <p className="mt-1 text-xs text-muted">по средним ценам категорий</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
            <p className="text-xs text-muted">Присутствуют</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-strong">
              {formatNumber(forecast.present)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatNumber(forecast.absent)} отсутствуют · {formatNumber(forecast.optOuts)} не обедают
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
            <p className="text-xs text-muted">Вчера продано</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-strong">
              {formatNumber(forecast.yesterdayTotalQty)}
            </p>
            <p className="mt-1 text-xs text-muted">единиц по всем категориям</p>
          </div>
        </div>

        {approved ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <p className="min-w-0 flex-1 text-xs text-emerald-200">
              Заявка подтверждена {formatDate(forecast.approvedAt, 'd MMMM, HH:mm')}
              {forecast.approvedBy ? ` · ${forecast.approvedBy}` : ''}. Можно посмотреть историю и списания.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <Info className="h-5 w-5 shrink-0 text-amber-400" />
            <p className="min-w-0 flex-1 text-xs text-amber-200">
              Проверьте количества по категориям и подтвердите заявку до начала приготовления. После подтверждения
              изменения доступны только через новую отметку посещаемости.
            </p>
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Прогноз по категориям</CardTitle>
                <p className="mt-1 text-xs text-muted">Шведский стол и свободный выбор блюд</p>
              </div>
              <Badge tone={approved ? 'success' : 'warning'} dot>
                {FORECAST_STATUS_LABELS[forecast.status]}
              </Badge>
            </CardHeader>
            <CardContent className="pt-2">
              <Table>
                <THead>
                  <TR>
                    <TH>Категория</TH>
                    <TH>Прогноз</TH>
                    <TH>Вчера</TH>
                    <TH>Списание вчера</TH>
                    <TH>Цена</TH>
                    <TH>Выручка</TH>
                  </TR>
                </THead>
                <TBody>
                  {forecast.categories.map((category) => {
                    const delta = category.qty - category.yesterdayQty
                    return (
                      <TR key={category.id}>
                        <TD className="font-medium text-strong">
                          {category.name}
                          <span className="ml-1.5 text-[11px] font-normal text-subtle">
                            {formatPercent(category.share * 100)} спроса
                          </span>
                        </TD>
                        <TD className="font-semibold text-strong">
                          {formatNumber(category.qty)}{' '}
                          <span className="text-[11px] font-normal text-subtle">{category.unit}</span>
                        </TD>
                        <TD>{formatNumber(category.yesterdayQty)}</TD>
                        <TD className={category.wasteQty ? 'text-amber-300' : 'text-muted'}>
                          {formatNumber(category.wasteQty)}
                        </TD>
                        <TD>{formatMoney(category.avgPrice)}</TD>
                        <TD>
                          <span className="inline-flex items-center gap-1">
                            {formatMoney(category.revenue)}
                            {delta !== 0 ? (
                              <TrendingUp
                                className={`h-3 w-3 ${delta > 0 ? 'text-emerald-400' : 'rotate-180 text-red-400'}`}
                              />
                            ) : null}
                          </span>
                        </TD>
                      </TR>
                    )
                  })}
                  <TR className="bg-app font-semibold">
                    <TD>Итого</TD>
                    <TD>{formatNumber(forecast.totalForecastQty)}</TD>
                    <TD>{formatNumber(forecast.yesterdayTotalQty)}</TD>
                    <TD>
                      {formatNumber(
                        forecast.categories.reduce((sum, category) => sum + category.wasteQty, 0),
                      )}
                    </TD>
                    <TD>—</TD>
                    <TD>{formatMoney(forecast.expectedRevenue)}</TD>
                  </TR>
                </TBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 self-start">
            <Card>
              <CardHeader>
                <CardTitle>Структура заявки</CardTitle>
                <Utensils className="h-4 w-4 text-subtle" />
              </CardHeader>
              <CardContent className="pt-2">
                <CategoryChart data={chartData} height={220} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Основание</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-subtle" />
              </CardHeader>
              <CardContent className="pt-2 text-xs">
                <div className="flex justify-between border-b border-line py-1.5">
                  <span className="text-muted">Отметок классов</span>
                  <span className="font-medium">
                    {forecast.markedClasses} / {forecast.totalClasses}
                  </span>
                </div>
                <div className="flex justify-between border-b border-line py-1.5">
                  <span className="text-muted">Последняя отметка</span>
                  <span className="font-medium">{formatDate(forecast.basedOnDate, 'd MMM')}</span>
                </div>
                <div className="flex justify-between border-b border-line py-1.5">
                  <span className="text-muted">Буфер</span>
                  <span className="font-medium">{forecast.bufferPercent}%</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted">Подтверждена</span>
                  <span className="font-medium">
                    {forecast.approvedAt ? formatDate(forecast.approvedAt, 'd MMM, HH:mm') : '—'}
                  </span>
                </div>
                {forecast.comment ? (
                  <p className="mt-2 rounded-lg bg-app p-2 text-[11px] text-muted">
                    {forecast.comment}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ApproveDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        date={date}
        total={forecast.totalForecastQty}
        onSubmit={handleApprove}
        loading={approve.isPending}
      />
    </>
  )
}
