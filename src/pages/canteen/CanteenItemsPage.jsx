import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Download, Pencil, Plus, Trash2, TrendingDown, Utensils, Wallet } from 'lucide-react'
import {
  useCanteenCategories,
  useCanteenSales,
  useCreateCanteenCategory,
  useDeleteCanteenCategory,
  useUpdateCanteenCategory,
} from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { CategoryChart } from '@/features/charts/Charts'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { ConfirmDialog, Dialog } from '@/shared/ui/dialog'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { Field, Input, Select } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { StatCard } from '@/shared/ui/stat-card'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/use-toast'
import { downloadCsv } from '@/shared/lib/csv'
import { formatDateShort } from '@/shared/lib/date'
import { formatMoney, formatNumber, formatPercent } from '@/shared/lib/format'

const schema = z.object({
  name: z.string().min(2, 'Укажите название категории'),
  share: z.coerce.number().min(0, 'Минимум 0%').max(100, 'Максимум 100%'),
  avgPrice: z.coerce.number().min(0, 'Минимум 0'),
  unit: z.string().min(1, 'Укажите единицу'),
})

function CategoryDialog({ open, onOpenChange, schoolId, category }) {
  const createCategory = useCreateCanteenCategory(schoolId)
  const updateCategory = useUpdateCanteenCategory()
  const { toast } = useToast()
  const editing = Boolean(category)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', share: 10, avgPrice: 3, unit: 'порция' },
  })

  useEffect(() => {
    if (!open) return
    reset(
      category
        ? {
            name: category.name,
            share: Math.round(category.share * 100),
            avgPrice: category.avgPrice,
            unit: category.unit,
          }
        : { name: '', share: 10, avgPrice: 3, unit: 'порция' },
    )
  }, [category, open, reset])

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      share: Number(values.share) / 100,
      avgPrice: Number(values.avgPrice),
      unit: values.unit,
    }
    try {
      if (editing) {
        await updateCategory.mutateAsync({ categoryId: category.id, payload })
        toast({ title: 'Категория обновлена', description: values.name, variant: 'success' })
      } else {
        await createCategory.mutateAsync(payload)
        toast({ title: 'Категория добавлена', description: values.name, variant: 'success' })
      }
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Не удалось сохранить категорию', description: error.message, variant: 'error' })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Редактировать категорию' : 'Новая категория'}
      description="Доля спроса и средняя цена влияют на заявку и ожидаемую выручку."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" form="category-form" loading={isSubmitting}>
            {editing ? 'Сохранить' : 'Добавить'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
        <Field label="Название" error={errors.name?.message} className="sm:col-span-2">
          <Input placeholder="Горячее" {...register('name')} />
        </Field>
        <Field label="Доля спроса, %" error={errors.share?.message} hint="Ориентир по истории продаж">
          <Input type="number" min="0" max="100" step="1" {...register('share')} />
        </Field>
        <Field label="Средняя цена, BYN" error={errors.avgPrice?.message}>
          <Input type="number" min="0" step="0.1" {...register('avgPrice')} />
        </Field>
        <Field label="Единица" error={errors.unit?.message}>
          <Select {...register('unit')}>
            <option value="порция">порция</option>
            <option value="шт">шт</option>
            <option value="стакан">стакан</option>
            <option value="комплект">комплект</option>
          </Select>
        </Field>
      </form>
    </Dialog>
  )
}

export default function CanteenItemsPage() {
  const user = useSession((state) => state.user)
  const schoolId = user?.schoolId
  const categoriesQuery = useCanteenCategories(schoolId)
  const salesQuery = useCanteenSales(schoolId, 14)
  const deleteCategory = useDeleteCanteenCategory()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const categories = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data])
  const sales = useMemo(() => salesQuery.data || [], [salesQuery.data])

  const aggregates = useMemo(() => {
    return categories.map((category) => {
      let qty = 0
      let revenue = 0
      let wasteQty = 0
      for (const day of sales) {
        const row = day.byCategory.find((item) => item.id === category.id)
        if (!row) continue
        qty += row.qty
        revenue += row.revenue
        wasteQty += row.wasteQty
      }
      return { ...category, qty, revenue, wasteQty, wasteRate: qty ? wasteQty / qty : 0 }
    })
  }, [categories, sales])

  const totals = useMemo(
    () =>
      aggregates.reduce(
        (acc, item) => ({
          revenue: acc.revenue + item.revenue,
          qty: acc.qty + item.qty,
          waste: acc.waste + item.wasteQty,
        }),
        { revenue: 0, qty: 0, waste: 0 },
      ),
    [aggregates],
  )

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (category) => {
    setEditing(category)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(deleting.id)
      toast({ title: 'Категория удалена', description: deleting.name, variant: 'success' })
      setDeleting(null)
    } catch (error) {
      toast({ title: 'Не удалось удалить категорию', description: error.message, variant: 'error' })
    }
  }

  const handleExport = () => {
    downloadCsv(
      `шведский-стол-категории-${schoolId}.csv`,
      ['Категория', 'Доля спроса, %', 'Средняя цена, BYN', 'Продано за 14 дней', 'Выручка, BYN', 'Списание', 'Доля списаний, %'],
      aggregates.map((category) => [
        category.name,
        Math.round(category.share * 100),
        category.avgPrice,
        category.qty,
        category.revenue,
        category.wasteQty,
        Math.round(category.wasteRate * 1000) / 10,
      ]),
    )
  }

  if (categoriesQuery.isLoading || salesQuery.isLoading) return <PageSkeleton />
  if (categoriesQuery.isError || salesQuery.isError) {
    return (
      <ErrorState
        description={(categoriesQuery.error || salesQuery.error)?.message}
        onRetry={() => {
          categoriesQuery.refetch()
          salesQuery.refetch()
        }}
      />
    )
  }

  const chartData = aggregates.map((category) => ({ name: category.name, qty: category.qty }))

  return (
    <>
      <PageHeader
        eyebrow="КШП / столовая"
        title="Шведский стол"
        description="Категории блюд, доли спроса и фактическая выручка за последние 14 дней."
        actions={
          <>
            <Button variant="outline" onClick={handleExport} disabled={!aggregates.length}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Категория
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Категории"
          value={formatNumber(categories.length)}
          hint="в меню шведского стола"
          icon={Utensils}
          tone="brand"
        />
        <StatCard
          label="Выручка за 14 дней"
          value={formatMoney(totals.revenue)}
          hint="по всем категориям"
          icon={Wallet}
          tone="emerald"
        />
        <StatCard
          label="Продано единиц"
          value={formatNumber(totals.qty)}
          hint="за последние 14 дней"
          icon={Utensils}
          tone="sky"
        />
        <StatCard
          label="Списания"
          value={formatNumber(totals.waste)}
          hint={totals.qty ? `${formatPercent((totals.waste / totals.qty) * 100, 1)} от продаж` : '—'}
          icon={TrendingDown}
          tone="amber"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Категории и экономика</CardTitle>
              <p className="mt-1 text-xs text-muted">Данные за последние 14 дней продаж</p>
            </div>
          </CardHeader>
          {!aggregates.length ? (
            <EmptyState
              icon={Utensils}
              title="Категорий пока нет"
              description="Добавьте категории блюд, чтобы прогноз считал заявку по шкале шведского стола."
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Добавить категорию
                </Button>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Категория</TH>
                  <TH>Доля</TH>
                  <TH>Средняя цена</TH>
                  <TH>Продано</TH>
                  <TH>Выручка</TH>
                  <TH>Списание</TH>
                  <TH className="text-right">Действия</TH>
                </TR>
              </THead>
              <TBody>
                {aggregates.map((category) => (
                  <TR key={category.id}>
                    <TD className="font-medium text-strong">{category.name}</TD>
                    <TD>{formatPercent(category.share * 100)}</TD>
                    <TD>{formatMoney(category.avgPrice)}</TD>
                    <TD>
                      {formatNumber(category.qty)}{' '}
                      <span className="text-[11px] text-subtle">{category.unit}</span>
                    </TD>
                    <TD>{formatMoney(category.revenue)}</TD>
                    <TD>
                      <Badge tone={category.wasteRate > 0.1 ? 'warning' : 'neutral'}>
                        {formatPercent(category.wasteRate * 100, 1)}
                      </Badge>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(category)}
                          aria-label="Редактировать категорию"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-400 hover:bg-red-500/10"
                          onClick={() => setDeleting(category)}
                          aria-label="Удалить категорию"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <div className="grid gap-4 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Продажи по категориям</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {chartData.length ? (
                <CategoryChart data={chartData} height={230} />
              ) : (
                <p className="py-6 text-center text-xs text-muted">Нет данных</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Последние дни</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-2">
              {[...sales]
                .slice(-7)
                .reverse()
                .map((day) => {
                  const wasteRate = day.totalQty ? day.wasteQty / day.totalQty : 0
                  return (
                    <div
                      key={day.date}
                      className="flex items-center justify-between rounded-lg bg-app px-3 py-2 text-xs"
                    >
                      <span className="text-muted">{formatDateShort(day.date)}</span>
                      <span className="text-strong">{formatNumber(day.totalQty)} ед.</span>
                      <span className="text-muted">{formatMoney(day.revenue)}</span>
                      <Badge tone={wasteRate > 0.1 ? 'warning' : 'success'}>
                        {formatPercent(wasteRate * 100, 1)}
                      </Badge>
                    </div>
                  )
                })}
            </CardContent>
          </Card>
        </div>
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schoolId={schoolId}
        category={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Удалить категорию?"
        description={
          deleting
            ? `Категория «${deleting.name}» и её история продаж будут удалены из прогноза.`
            : ''
        }
        confirmLabel="Удалить"
        loading={deleteCategory.isPending}
        onConfirm={handleDelete}
      />
    </>
  )
}
