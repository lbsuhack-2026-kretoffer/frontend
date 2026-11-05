import {
  ChartNoAxesColumn,
  ClipboardCheck,
  DoorOpen,
  FileBarChart,
  GraduationCap,
  History,
  LayoutDashboard,
  School,
  Settings,
  ShieldCheck,
  Users,
  Utensils,
} from 'lucide-react'

export const NAV_BY_ROLE = {
  platform_admin: [
    { to: '/platform', label: 'Обзор', icon: LayoutDashboard, end: true },
    { to: '/platform/schools', label: 'Школы', icon: School },
  ],
  school_admin: [
    { to: '/school', label: 'Дашборд', icon: LayoutDashboard, end: true },
    { to: '/school/classes', label: 'Классы', icon: Users },
    { to: '/school/teachers', label: 'Учителя', icon: GraduationCap },
    { to: '/school/forecast', label: 'Прогноз', icon: ChartNoAxesColumn },
    { to: '/school/reports', label: 'Отчёты', icon: FileBarChart },
    { to: '/school/settings', label: 'Настройки', icon: Settings },
  ],
  teacher: [
    { to: '/teacher', label: 'Мои классы', icon: LayoutDashboard, end: true },
    { to: '/teacher/history', label: 'История', icon: History },
  ],
  canteen: [
    { to: '/canteen', label: 'Заявка на завтра', icon: ClipboardCheck, end: true },
    { to: '/canteen/items', label: 'Шведский стол', icon: Utensils },
    { to: '/canteen/history', label: 'История', icon: ChartNoAxesColumn },
  ],
  guard: [
    { to: '/guard', label: 'Отметка входа', icon: DoorOpen, end: true },
    { to: '/guard/log', label: 'Журнал', icon: ShieldCheck },
  ],
}

export function navFor(role) {
  return NAV_BY_ROLE[role] || []
}
