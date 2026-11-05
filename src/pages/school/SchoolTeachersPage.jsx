import { useState } from 'react'
import { GraduationCap, Mail, Plus, UserPlus } from 'lucide-react'
import { useAssignTeacher, useSchoolClasses, useSchoolTeachers } from '@/api/hooks'
import { useSession } from '@/features/auth/session'
import { AssignClassDialog, InviteTeacherDialog } from '@/features/teachers/TeacherDialogs'
import { Avatar } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState, ErrorState } from '@/shared/ui/empty-state'
import { PageHeader } from '@/shared/ui/page-header'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { useToast } from '@/shared/ui/use-toast'
import { formatNumber } from '@/shared/lib/format'

export default function SchoolTeachersPage() {
  const user = useSession((state) => state.user)
  const teachersQuery = useSchoolTeachers(user?.schoolId)
  const classesQuery = useSchoolClasses(user?.schoolId)
  const assignTeacher = useAssignTeacher()
  const { toast } = useToast()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [assigning, setAssigning] = useState(null)

  const handleAssign = async (classId) => {
    try {
      await assignTeacher.mutateAsync({ classId, teacherId: assigning.id })
      toast({ title: 'Класс назначен', description: `${assigning.fullName} · ${classId}`, variant: 'success' })
      setAssigning(null)
    } catch (error) {
      toast({ title: 'Не удалось назначить класс', description: error.message, variant: 'error' })
    }
  }

  if (teachersQuery.isLoading) return <PageSkeleton />
  if (teachersQuery.isError) {
    return <ErrorState description={teachersQuery.error.message} onRetry={teachersQuery.refetch} />
  }

  const teachers = teachersQuery.data || []
  const assigned = teachers.filter((teacher) => teacher.classes?.length).length

  return (
    <>
      <PageHeader
        eyebrow="Школа"
        title="Учителя"
        description="Сотрудники, которые отмечают отсутствующих на первом уроке."
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Добавить учителя
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="text-xs text-muted">Всего учителей</p>
          <p className="mt-1 text-2xl font-semibold text-strong">{formatNumber(teachers.length)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="text-xs text-muted">С закреплёнными классами</p>
          <p className="mt-1 text-2xl font-semibold text-strong">{formatNumber(assigned)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="text-xs text-muted">Без класса</p>
          <p className="mt-1 text-2xl font-semibold text-strong">{formatNumber(teachers.length - assigned)}</p>
        </div>
      </div>

      {!teachers.length ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="Учителей пока нет"
            description="Добавьте учителей и назначьте им классы."
            action={
              <Button onClick={() => setInviteOpen(true)}>
                <Plus className="h-4 w-4" />
                Добавить учителя
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {teachers.map((teacher) => (
            <Card key={teacher.id}>
              <CardHeader>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={teacher.fullName} />
                  <div className="min-w-0">
                    <CardTitle className="truncate">{teacher.fullName}</CardTitle>
                    <p className="truncate text-[11px] text-muted">{teacher.position}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setAssigning(teacher)}>
                  <Plus className="h-3.5 w-3.5" />
                  Класс
                </Button>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Mail className="h-3.5 w-3.5" />
                  {teacher.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {teacher.classes?.length ? (
                    teacher.classes.map((cls) => (
                      <Badge key={cls.id} tone="brand">
                        {cls.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[11px] text-subtle">Классы не назначены</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InviteTeacherDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        schoolId={user?.schoolId}
      />
      <AssignClassDialog
        open={Boolean(assigning)}
        onOpenChange={(open) => !open && setAssigning(null)}
        teacher={assigning}
        classes={classesQuery.data || []}
        onAssign={handleAssign}
        loading={assignTeacher.isPending}
      />
    </>
  )
}
