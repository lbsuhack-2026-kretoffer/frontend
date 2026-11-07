import { useMemo, useState } from 'react'
import { ArrowRight, Ban, CheckCircle2, Plus, School as SchoolIcon, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDeleteSchool, usePlatformSchools, useSetSchoolAccess } from '@/api/hooks'
import { SchoolCreateDialog } from '@/features/schools/SchoolFormDialog'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { buttonStyles } from '@/shared/ui/button-styles'
import { Card } from '@/shared/ui/card'
import { ConfirmDialog, Dialog } from '@/shared/ui/dialog'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { Skeleton } from '@/shared/ui/skeleton'
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { formatNumber } from '@/shared/lib/format'
import { MEAL_PLAN_LABELS } from '@/shared/lib/labels'

export default function PlatformSchoolsPage() {
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [schoolToDelete, setSchoolToDelete] = useState(null)
  const schools = usePlatformSchools({ query, pageSize: 50 })
  const setAccess = useSetSchoolAccess()
  const deleteSchool = useDeleteSchool()
  const { toast } = useToast()

  const items = useMemo(() => schools.data?.items || [], [schools.data])

  const toggleAccess = async (school) => {
    try {
      await setAccess.mutateAsync({ schoolId: school.id, enabled: !school.accessEnabled })
      toast({
        title: school.accessEnabled ? 'Доступ заблокирован' : 'Доступ восстановлен',
        description: school.name,
        variant: 'success',
      })
    } catch (error) {
      toast({ title: 'Не удалось изменить доступ', description: error.message, variant: 'error' })
    }
  }

  const handleDeleteSchool = async () => {
    if (!schoolToDelete) return
    try {
      await deleteSchool.mutateAsync(schoolToDelete.id)
      toast({ title: 'Школа удалена', variant: 'success' })
      setDeleteOpen(false)
      setSchoolToDelete(null)
      schools.refetch()
    } catch (error) {
      toast({ title: 'Не удалось удалить школу', description: error.message, variant: 'error' })
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Платформа"
        title="Школы"
        description="Онбординг школ, назначение завучей и управление доступом. Сервис бесплатный — без тарифов и подписок."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Добавить школу
          </Button>
        }
      />

      <Card className="mb-4 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию, городу или адресу"
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {schools.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        ) : schools.isError ? (
          <ErrorState description={schools.error.message} onRetry={schools.refetch} />
        ) : !items.length ? (
          <EmptyState
            icon={SchoolIcon}
            title={query ? 'Ничего не найдено' : 'Школ пока нет'}
            description={query ? 'Попробуйте изменить запрос.' : 'Добавьте первую школу и назначьте завуча.'}
            action={
              !query ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Добавить школу
                </Button>
              ) : null
            }
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Школа</TH>
                <TH>Город</TH>
                <TH>Район</TH>
                <TH>Питание</TH>
                <TH>Ученики</TH>
                <TH>Классы</TH>
                <TH>Доступ</TH>
                <TH className="text-right">Действия</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((school) => (
                <TR key={school.id}>
                  <TD>
                    <Link
                      to={`/platform/schools/${school.id}`}
                      className="flex items-center gap-2 font-medium text-strong hover:text-brand-700"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <SchoolIcon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block">{school.name}</span>
                        <span className="block text-[11px] font-normal text-muted">{school.address}</span>
                      </span>
                    </Link>
                  </TD>
                  <TD>{school.city}</TD>
                  <TD>{school.district || '—'}</TD>
                  <TD>
                    <Badge tone={school.mealPlan === 'canteen' ? 'violet' : 'neutral'}>
                      {MEAL_PLAN_LABELS[school.mealPlan]}
                    </Badge>
                  </TD>
                  <TD>{formatNumber(school.studentsCount)}</TD>
                  <TD>{formatNumber(school.classesCount)}</TD>
                  <TD>
                    <Badge tone={school.accessEnabled ? 'success' : 'danger'} dot>
                      {school.accessEnabled ? 'Активна' : 'Заблокирована'}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => toggleAccess(school)}
                        className={cn(
                          'rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors',
                          school.accessEnabled
                            ? 'text-red-400 hover:bg-red-500/10'
                            : 'text-emerald-300 hover:bg-emerald-500/10',
                        )}
                      >
                        {school.accessEnabled ? (
                          <span className="inline-flex items-center gap-1">
                            <Ban className="h-3 w-3" /> Блокировать
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Разблокировать
                          </span>
                        )}
                      </button>
                      <Link
                        to={`/platform/schools/${school.id}`}
                        className={buttonStyles({ variant: 'ghost', size: 'icon-sm' })}
                        aria-label={`Открыть ${school.name}`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSchoolToDelete(school)
                          setDeleteOpen(true)
                        }}
                        aria-label={`Удалить ${school.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <SchoolCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => !open && setDeleteOpen(false)}
        title="Удалить школу?"
        description={
          schoolToDelete
            ? `Школа «${schoolToDelete.name}» и все связанные с ней классы, ученики и посещаемость будут удалены безвозвратно.`
            : ''
        }
        confirmLabel="Удалить"
        loading={deleteSchool.isPending}
        onConfirm={handleDeleteSchool}
      />
    </>
  )
}
