import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppShell from '@/app/AppShell'
import { HomeRedirect, ProtectedRoute, RoleRoute } from '@/app/guards'
import LoginPage from '@/pages/auth/LoginPage'
import ForbiddenPage from '@/pages/ForbiddenPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { ErrorBoundary } from '@/shared/ui/error-boundary'

const PlatformDashboardPage = lazy(() => import('@/pages/platform/PlatformDashboardPage'))
const PlatformSchoolsPage = lazy(() => import('@/pages/platform/PlatformSchoolsPage'))
const PlatformSchoolPage = lazy(() => import('@/pages/platform/PlatformSchoolPage'))
const PlatformKitchenPage = lazy(() => import('@/pages/platform/PlatformKitchenPage'))
const KitchenPage = lazy(() => import('@/pages/kitchen/KitchenPage'))

const SchoolDashboardPage = lazy(() => import('@/pages/school/SchoolDashboardPage'))
const SchoolClassesPage = lazy(() => import('@/pages/school/SchoolClassesPage'))
const ClassDetailPage = lazy(() => import('@/pages/school/ClassDetailPage'))
const SchoolTeachersPage = lazy(() => import('@/pages/school/SchoolTeachersPage'))
const SchoolForecastPage = lazy(() => import('@/pages/school/SchoolForecastPage'))
const SchoolReportsPage = lazy(() => import('@/pages/school/SchoolReportsPage'))
const SchoolSettingsPage = lazy(() => import('@/pages/school/SchoolSettingsPage'))

const TeacherHomePage = lazy(() => import('@/pages/teacher/TeacherHomePage'))
const AttendancePage = lazy(() => import('@/pages/teacher/AttendancePage'))
const TeacherHistoryPage = lazy(() => import('@/pages/teacher/TeacherHistoryPage'))

const CanteenPage = lazy(() => import('@/pages/canteen/CanteenPage'))
const CanteenItemsPage = lazy(() => import('@/pages/canteen/CanteenItemsPage'))
const CanteenHistoryPage = lazy(() => import('@/pages/canteen/CanteenHistoryPage'))

const GuardPage = lazy(() => import('@/pages/guard/GuardPage'))
const GuardLogPage = lazy(() => import('@/pages/guard/GuardLogPage'))

const WithErrorBoundary = ({ component: Component, ...props }) => (
  <ErrorBoundary {...props}>
    <Component />
  </ErrorBoundary>
)

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<HomeRedirect />} />

          <Route element={<RoleRoute allow={['platform_admin']} />}>
            <Route path="/platform" element={<WithErrorBoundary component={PlatformDashboardPage} />} />
            <Route path="/platform/schools" element={<WithErrorBoundary component={PlatformSchoolsPage} />} />
            <Route path="/platform/schools/:schoolId" element={<WithErrorBoundary component={PlatformSchoolPage} />} />
            <Route path="/platform/kitchens" element={<WithErrorBoundary component={PlatformKitchenPage} />} />
          </Route>

          <Route element={<RoleRoute allow={['canteen', 'platform_admin']} />}>
            <Route path="/kitchen" element={<WithErrorBoundary component={KitchenPage} />} />
          </Route>

          <Route element={<RoleRoute allow={['school_admin']} />}>
            <Route path="/school" element={<WithErrorBoundary component={SchoolDashboardPage} />} />
            <Route path="/school/classes" element={<WithErrorBoundary component={SchoolClassesPage} />} />
            <Route path="/school/classes/:classId" element={<WithErrorBoundary component={ClassDetailPage} />} />
            <Route path="/school/teachers" element={<WithErrorBoundary component={SchoolTeachersPage} />} />
            <Route path="/school/forecast" element={<WithErrorBoundary component={SchoolForecastPage} />} />
            <Route path="/school/reports" element={<WithErrorBoundary component={SchoolReportsPage} />} />
            <Route path="/school/settings" element={<WithErrorBoundary component={SchoolSettingsPage} />} />
          </Route>

          <Route element={<RoleRoute allow={['teacher']} />}>
            <Route path="/teacher" element={<WithErrorBoundary component={TeacherHomePage} />} />
            <Route path="/teacher/attendance/:classId" element={<WithErrorBoundary component={AttendancePage} />} />
            <Route path="/teacher/history" element={<WithErrorBoundary component={TeacherHistoryPage} />} />
          </Route>

          <Route element={<RoleRoute allow={['canteen']} />}>
            <Route path="/canteen" element={<WithErrorBoundary component={CanteenPage} />} />
            <Route path="/canteen/items" element={<WithErrorBoundary component={CanteenItemsPage} />} />
            <Route path="/canteen/history" element={<WithErrorBoundary component={CanteenHistoryPage} />} />
          </Route>

          <Route element={<RoleRoute allow={['guard']} />}>
            <Route path="/guard" element={<WithErrorBoundary component={GuardPage} />} />
            <Route path="/guard/log" element={<WithErrorBoundary component={GuardLogPage} />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
