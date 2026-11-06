import { useState } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  Download,
  Info,
  Printer,
  Save,
  SlidersHorizontal,
  Utensils,
  X,
} from 'lucide-react'
import {
  useApproveForecast,
  useAttendanceSummary,
  useForecast,
  useForecastAdjustments,
  useForecastHistory,
  useRemoveForecastAdjustment,
  useSchool,
  useSetForecastAdjustment,
  useUpdateSchool,
} from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { ForecastChart } from '@/features/charts/Charts'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Dialog } from '@/shared/ui/dialog'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { Field, Input, Textarea } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/use-toast'
import { downloadCsv, printPage } from '@/shared/lib/csv'
import { addDaysISO, formatDate, relativeDayLabel, todayISO, tomorrowISO } from '@/shared/lib/date'
import { formatNumber, formatPercent, portionsLabel } from '@/shared/lib/format'
import {
  AGE_GROUP_LABELS,
  AGE_GROUP_TONE,
  FORECAST_STATUS_LABELS,
  MEAL_PLAN_LABELS,
} from '@/shared/lib/labels'

function ApprovalDialog({ open, onOpenChange, forecast, onSubmit, loading }) {
  const [comment, setComment] = useState('')
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Подтвердить заявку"
      description={`${forecast ? formatDate(forecast.date, 'd MMMM') : ''} · ${forecast ? portionsLabel(forecast.totalPortions) : ''}`}
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
      <Field label="Комментарий" hint="Необязательно: причина ручной корректировки">
        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Например: экскурсия у 10А, заявка скорректирована"
        />
      </Field>
    </Dialog>
  )
}

function AdjustmentDialog({
  open,
  onOpenChange,
  adjustment,
  forecastDate,
  totalPortions,
  onSubmit,
  loading,
}) {
  const [delta, setDelta] = useState(String(adjustment?.delta ?? ''))
  const [reason, setReason] = useState(adjustment?.reason ?? '')

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ручная корректировка заявки"
      description={`Дата: ${formatDate(forecastDate, 'd MMMM')} · прогноз модели ${portionsLabel(totalPortions)}`}
    >
      <Field label="Корректировка, порций" hint="Положительное число — больше обедов, отрицательное — меньше">
        <Input
          type="number"
          value={delta}
          onChange={(event) => setDelta(event.target.value)}
          placeholder="Например: -10"
        />
      </Field>
      <Field label="Причина" hint="Например: экскурсия 10А, спортсоревнования">
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Например: 10 человек уехали на экскурсию"
        />
      </Field>
      <div className="mt-3 text-[11px] text-muted">
        Корректировка прибавляется к прогнозу модели. При отрицательном значении заявка уменьшается, но не ниже нуля.
      </div>
      <>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Отмена
        </Button>
        <Button
          loading={loading}
          onClick={() => {
            onSubmit(Number(delta) || 0, reason)
            setDelta('')
            setReason('')
          }}
        >
          Применить
        </Button>
      </>
    </Dialog>
  )
}

export default function SchoolForecastPage() {
  const user = useSession((state) => state.user)
  const schoolId = user?.schoolId
  const [date, setDate] = useState(tomorrowISO())
  const [bufferValue, setBufferValue] = useState('')
  const [approveOpen, setApproveOpen] = useState(false)

  const schoolQuery = useSchool(schoolId)
  const forecastQuery = useForecast(schoolId, date)
  const historyQuery = useForecastHistory(schoolId)
  const summaryQuery = useAttendanceSummary(schoolId, todayISO())
  const updateSchool = useUpdateSchool()
  const approve = useApproveForecast()
  const adjustmentsQuery = useForecastAdjustments(schoolId)
  const setAdjustment = useSetForecastAdjustment()
  const removeAdjustment = useRemoveForecastAdjustment()
  const { toast } = useToast()

  const forecast = forecastQuery.data

  const [adjustOpen, setAdjustOpen] = useState(false)

  const adjustment = adjustmentsQuery.data?.find((a) => a.date === date) || null

  const handleSetAdjustment = async (delta, reason) => {
    try {
      await setAdjustment.mutateAsync({ schoolId, date, delta, reason })
      setAdjustOpen(false)
      toast({
        title: 'Корректировка применена',
        description: `${delta > 0 ? '+' : ''}${delta} порций${reason ? ' · ' + reason : ''}`,
        variant: 'success',
      })
    } catch (error) {
      toast({ title: 'Не удалось применить корректировку', description: error.message, variant: 'error' })
    }
  }

  const handleRemoveAdjustment = async () => {
    try {
      await removeAdjustment.mutateAsync({ schoolId, date })
      setAdjustOpen(false)
      toast({ title: 'Корректировка сброшена', variant: 'success' })
    } catch (error) {
      toast({ title: 'Не удалось сбросить корректировку', description: error.message, variant: 'error' })
    }
  }

  const unmarked = summaryQuery.data?.classes?.filter((cls) => cls.status === 'pending') || []

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

  const applyBuffer = async () => {
    const value = Number(bufferValue)
    if (!Number.isFinite(value) || value < 0 || value > 30) {
      toast({ title: 'Буфер должен быть от 0 до 30%', variant: 'error' })
      return
    }
    try {
      await updateSchool.mutateAsync({ schoolId, payload: { bufferPercent: value } })
      toast({ title: 'Буфер обновлён', description: `${value}%`, variant: 'success' })
      setBufferValue('')
    } catch (error) {
      toast({ title: 'Не удалось обновить буфер', description: error.message, variant: 'error' })
    }
  }

  const handleApprove = async (comment) => {
    try {
      await approve.mutateAsync({ schoolId, date, comment })
      toast({
        title: 'Заявка подтверждена',
        description: `${formatDate(date, 'd MMMM')} · ${portionsLabel(forecast.totalPortions)}`,
        variant: 'success',
      })
      setApproveOpen(false)
    } catch (error) {
      toast({ title: 'Не удалось подтвердить заявку', description: error.message, variant: 'error' })
    }
  }

  const handleExport = () => {
    const rows = [
      ['Школа', school.name],
      ['Дата заявки', date],
      ['Схема питания', MEAL_PLAN_LABELS[forecast.mealPlan]],
      ['Статус', FORECAST_STATUS_LABELS[forecast.status]],
      ['Ученики', forecast.totalStudents],
      ['Не обедают', forecast.optOuts],
      ['Отсутствуют', forecast.absent],
      ['Присутствуют', forecast.present],
      ['Буфер, %', forecast.bufferPercent],
      ['Итого порций', forecast.totalPortions],
      ['Уверенность модели, %', Math.round(forecast.confidence * 100)],
      ...forecast.byAgeGroup.flatMap((group) => [
        [`${AGE_GROUP_LABELS[group.ageGroup]} · порции`, group.portions],
        [`${AGE_GROUP_LABELS[group.ageGroup]} · присутствуют`, group.present],
      ]),
      ...forecast.byCategory.flatMap((category) => [
        [`${category.name} · прогноз, ${category.unit}`, category.qty],
        [`${category.name} · выручка, BYN`, category.revenue],
      ]),
    ]
    downloadCsv(
      `заявка-${school.name.replace(/\s+/g, '-')}-${date}.csv`,
      ['Показатель', 'Значение'],
      rows,
    )
  }

  return (
    <>
      <div className="print-only mb-4">
        <p className="text-lg font-semibold">{school.name}</p>
        <p className="text-sm">
          Заявка на {formatDate(date, 'd MMMM yyyy')} · {MEAL_PLAN_LABELS[forecast.mealPlan]}
        </p>
      </div>

      <PageHeader
        eyebrow="Школа"
        title="Прогноз на завтра"
        description="Заявка формируется по отметкам учителей, постоянным отказникам и буферу на погрешность."
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
            <Button
              onClick={() => setApproveOpen(true)}
              disabled={forecast.status === 'approved'}
              loading={approve.isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              {forecast.status === 'approved' ? 'Подтверждена' : 'Подтвердить'}
            </Button>
          </>
        }
      />

      <div className="print-area">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
            <p className="text-xs text-muted">Итого порций</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-strong">
              {formatNumber(forecast.totalPortions)}
            </p>
            <p className="mt-1 text-xs text-muted">
              буфер {forecast.bufferPercent}% · {FORECAST_STATUS_LABELS[forecast.status]}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
            <p className="text-xs text-muted">Присутствуют</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-strong">
              {formatNumber(forecast.present)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {forecast.absent} отсутствуют · {forecast.optOuts} не обедают
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
            <p className="text-xs text-muted">Отмечено классов</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-strong">
              {forecast.markedClasses} / {forecast.totalClasses}
            </p>
            <p className="mt-1 text-xs text-muted">основа: {formatDate(forecast.basedOnDate, 'd MMMM')}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
            <p className="text-xs text-muted">Уверенность модели</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-strong">
              {formatPercent(forecast.confidence * 100)}
            </p>
            <p className="mt-1 text-xs text-muted">по истории точности</p>
          </div>
        </div>

        {adjustment ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3">
            <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
            <div>
              <p className="text-xs text-brand-200">
                Ручная корректировка:{' '}
                <span className="font-semibold text-brand-800">
                  {adjustment.delta > 0 ? '+' : ''}{adjustment.delta} порций
                </span>
                {adjustment.reason ? ` · ${adjustment.reason}` : ''}
              </p>
              <p className="mt-0.5 text-[10px] text-brand-200">
                Установлено {adjustment.createdBy ? adjustment.createdBy : '—'} ·
                {adjustment.createdAt ? formatDate(adjustment.createdAt, 'd MMM, HH:mm') : '—'}
              </p>
            </div>
            <Button size="icon" onClick={handleRemoveAdjustment} aria-label="Сбросить корректировку">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <Button
          onClick={() => setAdjustOpen(true)}
          className="mt-4"
          disabled={forecast.status === 'approved'}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {adjustment ? 'Изменить корректировку' : 'Корректировать заявку (±)'}
        </Button>

        {unmarked.length ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-200">
              Без отметки сегодня: <span className="font-semibold">{unmarked.map((cls) => cls.name).join(', ')}</span>.
              Для них используется последняя доступная отметка — заявка может быть менее точной.
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Разбивка по возрастным группам</CardTitle>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(date, 'd MMMM, EEEE')} · {relativeDayLabel(date)}
                </p>
              </div>
              <Badge tone={forecast.status === 'approved' ? 'success' : 'warning'} dot>
                {FORECAST_STATUS_LABELS[forecast.status]}
              </Badge>
            </CardHeader>
            <CardContent className="pt-2">
              <Table className="min-w-full">
                <THead>
                  <TR>
                    <TH>Группа</TH>
                    <TH>Ученики</TH>
                    <TH>Не обедают</TH>
                    <TH>Отсутствуют</TH>
                    <TH>Присутствуют</TH>
                    <TH>Порции</TH>
                  </TR>
                </THead>
                <TBody>
                  {forecast.byAgeGroup.map((group) => (
                    <TR key={group.ageGroup}>
                      <TD>
                        <Badge tone={AGE_GROUP_TONE[group.ageGroup]}>{AGE_GROUP_LABELS[group.ageGroup]}</Badge>
                      </TD>
                      <TD>{group.students}</TD>
                      <TD>{group.optOuts}</TD>
                      <TD>{group.absent}</TD>
                      <TD>{group.present}</TD>
                      <TD className="font-semibold text-strong">{group.portions}</TD>
                    </TR>
                  ))}
                  <TR className="bg-app font-semibold">
                    <TD>Итого</TD>
                    <TD>{forecast.totalStudents}</TD>
                    <TD>{forecast.optOuts}</TD>
                    <TD>{forecast.absent}</TD>
                    <TD>{forecast.present}</TD>
                    <TD className="text-brand-800">{forecast.totalPortions}</TD>
                  </TR>
                </TBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Буфер на погрешность</CardTitle>
                <Utensils className="h-4 w-4 text-subtle" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-end gap-3">
                  <div>
                    <p className="text-2xl font-semibold text-strong">{forecast.bufferPercent}%</p>
                    <p className="text-xs text-muted">текущий запас</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={bufferValue}
                      onChange={(event) => setBufferValue(event.target.value)}
                      placeholder={String(forecast.bufferPercent)}
                    />
                  </div>
                  <Button size="icon" variant="outline" onClick={applyBuffer} disabled={!bufferValue} aria-label="Применить буфер">
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-3 text-[11px] text-muted">
                  Снижайте буфер по мере накопления данных. На старте рекомендуется 10–12%.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Основание</CardTitle>
                <SlidersHorizontal className="h-4 w-4 text-subtle" />
              </CardHeader>
              <CardContent className="pt-2 text-xs text-muted">
                <div className="flex justify-between border-b border-line py-1.5">
                  <span className="text-muted">Классов в школе</span>
                  <span className="font-medium">{forecast.totalClasses}</span>
                </div>
                <div className="flex justify-between border-b border-line py-1.5">
                  <span className="text-muted">Отметок получено</span>
                  <span className="font-medium">{forecast.markedClasses}</span>
                </div>
                <div className="flex justify-between border-b border-line py-1.5">
                  <span className="text-muted">Последняя отметка</span>
                  <span className="font-medium">{formatDate(forecast.basedOnDate, 'd MMM')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted">Подтверждена</span>
                  <span className="font-medium">{forecast.approvedAt ? formatDate(forecast.approvedAt, 'd MMM, HH:mm') : '—'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {forecast.mealPlan === 'canteen' ? (
          <Card className="mt-4">
            <CardHeader>
              <div>
                <CardTitle>Прогноз по категориям блюд</CardTitle>
                <p className="mt-1 text-xs text-muted">Для шведского стола и свободного выбора</p>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {!forecast.byCategory.length ? (
                <EmptyState title="Категории не настроены" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {forecast.byCategory.map((category) => (
                    <div key={category.id} className="rounded-xl border border-line p-3">
                      <p className="text-xs text-muted">{category.name}</p>
                      <p className="mt-1 text-xl font-semibold text-strong">
                        {formatNumber(category.qty)} <span className="text-xs font-normal text-subtle">{category.unit}</span>
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        {formatPercent(category.share * 100)} спроса · {formatNumber(category.revenue)} BYN
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-4">
          <CardHeader>
            <div>
              <CardTitle>История прогноза</CardTitle>
              <p className="mt-1 text-xs text-muted">Последние 14 дней: прогноз и фактический расход</p>
            </div>
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
      </div>

      <ApprovalDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        forecast={forecast}
        onSubmit={handleApprove}
        loading={approve.isPending}
      />

      <AdjustmentDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        adjustment={adjustment}
        forecastDate={date}
        totalPortions={forecast.totalPortions}
        onSubmit={handleSetAdjustment}
        loading={setAdjustment.isPending}
      />
    </>
  )
}
