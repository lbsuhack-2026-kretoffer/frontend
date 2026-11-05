import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '@/features/auth/session'
import { ROLE_HOME } from '@/shared/lib/labels'

export function ProtectedRoute() {
  const user = useSession((state) => state.user)
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function RoleRoute({ allow }) {
  const user = useSession((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  if (!allow.includes(user.role)) return <Navigate to="/403" replace />
  return <Outlet />
}

export function HomeRedirect() {
  const user = useSession((state) => state.user)
  return <Navigate to={ROLE_HOME[user?.role] || '/login'} replace />
}
