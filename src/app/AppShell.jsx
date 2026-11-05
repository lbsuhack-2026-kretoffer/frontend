import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  GraduationCap,
  LogOut,
  Menu,
  MonitorSmartphone,
  RefreshCcw,
  UserRound,
  X,
} from 'lucide-react'
import { useState, Suspense } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { navFor } from '@/app/nav'
import RouteFallback from '@/app/RouteFallback'
import { useSession } from '@/features/auth/session'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { Avatar } from '@/shared/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown'
import { cn } from '@/shared/lib/cn'
import { formatDate, todayISO } from '@/shared/lib/date'
import { ROLE_LABELS } from '@/shared/lib/labels'

function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-black shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </div>
      {!compact ? (
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-strong">Баланс-Пит</p>
          <p className="text-[10px] font-medium text-muted">школьное питание</p>
        </div>
      ) : null}
    </div>
  )
}

function NavList({ items, onNavigate, compact = false }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-muted hover:bg-elevated hover:text-strong',
                compact && 'py-2',
              )
            }
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function AppShell() {
  const user = useSession((state) => state.user)
  const logout = useSession((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const items = navFor(user?.role)

  const handleLogout = () => {
    logout()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  const handleReset = () => {
    logout()
    queryClient.clear()
    sessionStorage.removeItem('sbp-session')
    window.location.assign('/login')
  }

  const activeItem =
    items.find((item) => item.to === location.pathname) ||
    items.find((item) => item.to !== '/' && location.pathname.startsWith(item.to))

  return (
    <div className="min-h-dvh bg-app">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex no-print">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Link to="/" aria-label="На главную">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-subtle">
            {ROLE_LABELS[user?.role] || 'Меню'}
          </p>
          <NavList items={items} />
        </div>
        <div className="border-t border-line p-3">
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-300">
            <MonitorSmartphone className="h-3.5 w-3.5" />
            Демо-режим
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-elevated"
              >
                <Avatar name={user?.fullName} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-strong">
                    {user?.fullName}
                  </span>
                  <span className="block truncate text-[10px] text-muted">
                    {user?.schoolName || user?.position}
                  </span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-subtle" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
              <DropdownMenuLabel>{ROLE_LABELS[user?.role]}</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => navigate('/login')}>
                <UserRound className="h-3.5 w-3.5" />
                Сменить роль
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleReset}>
                <RefreshCcw className="h-3.5 w-3.5" />
                Сбросить демо
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-red-400">
                <LogOut className="h-3.5 w-3.5" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur no-print">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-muted hover:bg-elevated lg:hidden"
              aria-label="Открыть меню"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-strong">{activeItem?.label || 'Обзор'}</p>
              <p className="truncate text-[11px] text-muted">
                {user?.schoolName || 'Платформа'} · {formatDate(todayISO(), 'd MMMM, EEEE')}
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-full bg-elevated px-2.5 py-1 text-[11px] font-medium text-muted">
                {ROLE_LABELS[user?.role]}
              </span>
              <Avatar name={user?.fullName} size="sm" />
            </div>
          </div>
        </header>

        <main className={cn('mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 lg:py-7', user?.role === 'teacher' && 'pb-24 lg:pb-8')}>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {user?.role === 'teacher' ? (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden no-print">
          <div className="grid grid-cols-2">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium',
                      isActive ? 'text-brand-700' : 'text-muted',
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        </nav>
      ) : null}

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen} title="Меню" className="sm:max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <Logo />
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-elevated"
            onClick={() => setMobileOpen(false)}
            aria-label="Закрыть меню"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-4 rounded-xl bg-app p-3">
          <p className="text-xs font-semibold text-strong">{user?.fullName}</p>
          <p className="text-[11px] text-muted">
            {ROLE_LABELS[user?.role]} · {user?.schoolName || 'Платформа'}
          </p>
        </div>
        <NavList items={items} onNavigate={() => setMobileOpen(false)} />
        <div className="mt-4 grid gap-2 border-t border-line pt-4">
          <Button variant="outline" onClick={() => { setMobileOpen(false); navigate('/login') }}>
            Сменить роль
          </Button>
          <Button variant="danger-outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
