import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppShell from '@/app/AppShell'
import { HomeRedirect, ProtectedRoute, RoleRoute } from '@/app/guards'
import LoginPage from '@/pages/auth/LoginPage'
import ForbiddenPage from '@/pages/ForbiddenPage'
import NotFoundPage from '@/pages/NotFoundPage'

const PlatformDashboardPage = lazy(() => import('@/pages/platform/PlatformDashboardPage'))
const PlatformSchoolsPage = lazy(() => import('@/pages/platform/PlatformSchoolsPage'))
const PlatformSchoolPage = lazy(() => import('@/pages/platform/PlatformSchoolPage'))

const SchoolDashboardPage = lazy(() => import('@/pages/school/SchoolDashboardPage'))
const SchoolClassesPage = lazy(() => import('@/pages/school/SchoolClassesPage'))
const ClassDetailPage = lazy(() => import('@/pages/school/ClassDetailPage'))
const SchoolTeachersPage = lazy(() => import('@/pages/school/SchoolTeachersPage'))
const SchoolForecastPage = lazy(() => import('@/pages/school/SchoolForecastPage'))
const SchoolReportsPage = lazy(() => import('@/pages/school/SchoolReportsPage'))
const SchoolSettingsPage = lazy(() => import('@/pages/school/SchoolSettingsPage'))
const PlatformKitchenPage = lazy(() => import('@/pages/platform/PlatformKitchenPage'))

const TeacherHomePage = lazy(() => import('@/pages/teacher/TeacherHomePage'))
const AttendancePage = lazy(() => import('@/pages/teacher/AttendancePage'))
const TeacherHistoryPage = lazy(() => import('@/pages/teacher/TeacherHistoryPage'))

const CanteenPage = lazy(() => import('@/pages/canteen/CanteenPage'))
const CanteenItemsPage = lazy(() => import('@/pages/canteen/CanteenItemsPage'))
const CanteenHistoryPage = lazy(() => import('@/pages/canteen/CanteenHistoryPage'))

const GuardPage = lazy(() => import('@/pages/guard/GuardPage'))
const GuardLogPage = lazy(() => import('@/pages/guard/GuardLogPage'))

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<HomeRedirect />} />

          <Route element={<RoleRoute allow={['platform_admin']} />}>
            <Route path="/platform" element={<PlatformDashboardPage />} />
            <Route path="/platform/schools" element={<PlatformSchoolsPage />} />
            <Route path="/platform/schools/:schoolId" element={<PlatformSchoolPage />} />
            <Route path="/platform/kitchens" element={<PlatformKitchenPage />} />
          </Route>

          <Route element={<RoleRoute allow={['school_admin']} />}>
            <Route path="/school" element={<SchoolDashboardPage />} />
            <Route path="/school/classes" element={<SchoolClassesPage />} />
            <Route path="/school/classes/:classId" element={<ClassDetailPage />} />
            <Route path="/school/teachers" element={<SchoolTeachersPage />} />
            <Route path="/school/forecast" element={<SchoolForecastPage />} />
            <Route path="/school/reports" element={<SchoolReportsPage />} />
            <Route path="/school/settings" element={<SchoolSettingsPage />} />
          </Route>

          <Route element={<RoleRoute allow={['teacher']} />}>
            <Route path="/teacher" element={<TeacherHomePage />} />
            <Route path="/teacher/attendance/:classId" element={<AttendancePage />} />
            <Route path="/teacher/history" element={<TeacherHistoryPage />} />
          </Route>

          <Route element={<RoleRoute allow={['canteen']} />}>
            <Route path="/canteen" element={<CanteenPage />} />
            <Route path="/canteen/items" element={<CanteenItemsPage />} />
            <Route path="/canteen/history" element={<CanteenHistoryPage />} />
          </Route>

          <Route element={<RoleRoute allow={['guard']} />}>
            <Route path="/guard" element={<GuardPage />} />
            <Route path="/guard/log" element={<GuardLogPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
