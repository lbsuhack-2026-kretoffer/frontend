import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/session'
import { api } from '@/shared/api/client'
import { qk } from '@/shared/api/keys'

function useRefresh() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries()
}

export function useLogin() {
  const setUser = useSession((state) => state.setUser)
  return useMutation({
    mutationFn: (credentials) => api.post('/auth/login', credentials),
    onSuccess: (user) => setUser(user),
  })
}

export function usePlatformStats() {
  return useQuery({
    queryKey: qk.platformStats,
    queryFn: () => api.get('/platform/stats'),
  })
}

export function usePlatformSchools(params = {}) {
  return useQuery({
    queryKey: qk.platformSchools(params),
    queryFn: () => api.get('/platform/schools', { query: params }),
  })
}

export function useSchool(schoolId) {
  return useQuery({
    queryKey: qk.school(schoolId),
    queryFn: () => api.get(`/schools/${schoolId}`),
    enabled: Boolean(schoolId),
  })
}

export function useSchoolClasses(schoolId, date) {
  return useQuery({
    queryKey: qk.schoolClasses(schoolId, date),
    queryFn: () => api.get(`/schools/${schoolId}/classes`, { query: { date } }),
    enabled: Boolean(schoolId),
  })
}

export function useSchoolTeachers(schoolId) {
  return useQuery({
    queryKey: qk.schoolTeachers(schoolId),
    queryFn: () => api.get(`/schools/${schoolId}/teachers`),
    enabled: Boolean(schoolId),
  })
}

export function useSchoolStudents(schoolId, query, searchBy = 'surname') {
  return useQuery({
    queryKey: qk.schoolStudents(schoolId, query, searchBy),
    queryFn: () => api.get(`/schools/${schoolId}/students`, { query: { query, search_by: searchBy } }),
    enabled: Boolean(schoolId),
  })
}

export function useClassDetail(classId, date) {
  return useQuery({
    queryKey: qk.classDetail(classId, date),
    queryFn: () => api.get(`/classes/${classId}`, { query: { date } }),
    enabled: Boolean(classId),
  })
}

export function useClassStudents(classId) {
  return useQuery({
    queryKey: qk.classStudents(classId),
    queryFn: () => api.get(`/classes/${classId}/students`),
    enabled: Boolean(classId),
  })
}

export function useAttendance(classId, date) {
  return useQuery({
    queryKey: qk.attendance(classId, date),
    queryFn: () => api.get(`/classes/${classId}/attendance`, { query: { date } }),
    enabled: Boolean(classId && date),
  })
}

export function useAttendanceSummary(schoolId, date) {
  return useQuery({
    queryKey: qk.attendanceSummary(schoolId, date),
    queryFn: () => api.get(`/schools/${schoolId}/attendance/summary`, { query: { date } }),
    enabled: Boolean(schoolId && date),
  })
}

export function useForecast(schoolId, date) {
  return useQuery({
    queryKey: qk.forecast(schoolId, date),
    queryFn: () => api.get(`/schools/${schoolId}/forecast`, { query: { date } }),
    enabled: Boolean(schoolId && date),
  })
}

export function useForecastHistory(schoolId, days = 14) {
  return useQuery({
    queryKey: qk.forecastHistory(schoolId),
    queryFn: () => api.get(`/schools/${schoolId}/forecast/history`, { query: { days } }),
    enabled: Boolean(schoolId),
  })
}

export function useCanteenForecast(schoolId, date) {
  return useQuery({
    queryKey: qk.canteenForecast(schoolId, date),
    queryFn: () => api.get(`/schools/${schoolId}/canteen/forecast`, { query: { date } }),
    enabled: Boolean(schoolId && date),
  })
}

export function useCanteenSales(schoolId, days = 14) {
  return useQuery({
    queryKey: qk.canteenSales(schoolId, days),
    queryFn: () => api.get(`/schools/${schoolId}/canteen/sales`, { query: { days } }),
    enabled: Boolean(schoolId),
  })
}

export function useCanteenCategories(schoolId) {
  return useQuery({
    queryKey: qk.canteenCategories(schoolId),
    queryFn: () => api.get(`/schools/${schoolId}/canteen/categories`),
    enabled: Boolean(schoolId),
  })
}

export function useAccessEvents(schoolId, date) {
  return useQuery({
    queryKey: qk.accessEvents(schoolId, date),
    queryFn: () => api.get(`/schools/${schoolId}/access-events`, { query: { date } }),
    enabled: Boolean(schoolId && date),
  })
}

export function useMyClasses(date) {
  return useQuery({
    queryKey: qk.teacherClasses(date),
    queryFn: () => api.get('/teachers/me/classes', { query: { date } }),
    enabled: Boolean(date),
  })
}

export function useMyAttendanceHistory(days = 14) {
  return useQuery({
    queryKey: qk.teacherHistory(days),
    queryFn: () => api.get('/teachers/me/attendance', { query: { days } }),
  })
}

export function useCreateSchool() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (payload) => api.post('/platform/schools', payload),
    onSuccess: refresh,
  })
}

export function useUpdateSchool() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ schoolId, payload, scope = 'school' }) =>
      api.patch(`/${scope === 'platform' ? 'platform/schools' : 'schools'}/${schoolId}`, payload),
    onSuccess: refresh,
  })
}

export function useAssignSchoolAdmin() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ schoolId, payload }) => api.post(`/platform/schools/${schoolId}/admins`, payload),
    onSuccess: refresh,
  })
}

export function useRevokeSchoolAdmin() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ schoolId, userId }) =>
      api.delete(`/platform/schools/${schoolId}/admins/${userId}`),
    onSuccess: refresh,
  })
}

export function useSetSchoolAccess() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ schoolId, enabled }) =>
      api.post(`/platform/schools/${schoolId}/access`, { enabled }),
    onSuccess: refresh,
  })
}

export function useCreateClass(schoolId) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (payload) => api.post(`/schools/${schoolId}/classes`, payload),
    onSuccess: refresh,
  })
}

export function useUpdateClass() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ classId, payload }) => api.patch(`/classes/${classId}`, payload),
    onSuccess: refresh,
  })
}

export function useDeleteClass() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (classId) => api.delete(`/classes/${classId}`),
    onSuccess: refresh,
  })
}

export function useAddStudent(classId) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (payload) => api.post(`/classes/${classId}/students`, payload),
    onSuccess: refresh,
  })
}

export function useUpdateStudent() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ studentId, payload }) => api.patch(`/students/${studentId}`, payload),
    onSuccess: refresh,
  })
}

export function useDeleteStudent() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (studentId) => api.delete(`/students/${studentId}`),
    onSuccess: refresh,
  })
}

export function useInviteTeacher(schoolId) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (payload) => api.post(`/schools/${schoolId}/teachers`, payload),
    onSuccess: refresh,
  })
}

export function useAssignTeacher() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ classId, teacherId }) => api.post(`/classes/${classId}/teacher`, { teacherId }),
    onSuccess: refresh,
  })
}

export function useSaveAttendance() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ classId, date, absentStudentIds }) =>
      api.put(`/classes/${classId}/attendance`, { date, absentStudentIds }),
    onSuccess: refresh,
  })
}

export function useApproveForecast() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ schoolId, date, comment }) =>
      api.post(`/schools/${schoolId}/forecast/${date}/approve`, { comment }),
    onSuccess: refresh,
  })
}

export function useForecastAdjustments(schoolId) {
  return useQuery({
    queryKey: qk.forecastAdjustments(schoolId),
    queryFn: () => api.get(`/schools/${schoolId}/forecast/adjustments`),
    enabled: Boolean(schoolId),
  })
}

export function useSetForecastAdjustment() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ schoolId, date, delta, reason }) =>
      api.post(`/schools/${schoolId}/forecast/${date}/adjust`, { delta, reason }),
    onSuccess: refresh,
  })
}

export function useRemoveForecastAdjustment() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ schoolId, date }) =>
      api.delete(`/schools/${schoolId}/forecast/${date}/adjust`),
    onSuccess: refresh,
  })
}

export function useManualAccessEvent(schoolId) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (payload) => api.post(`/schools/${schoolId}/access-events/manual`, payload),
    onSuccess: refresh,
  })
}

export function useCreateCanteenCategory(schoolId) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (payload) => api.post(`/schools/${schoolId}/canteen/categories`, payload),
    onSuccess: refresh,
  })
}

export function useUpdateCanteenCategory() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ categoryId, payload }) =>
      api.patch(`/canteen/categories/${categoryId}`, payload),
    onSuccess: refresh,
  })
}

export function useDeleteCanteenCategory() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (categoryId) => api.delete(`/canteen/categories/${categoryId}`),
    onSuccess: refresh,
  })
}

export function useCreatePlatformAdmin() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (payload) => api.post('/auth/platform-admins', payload),
    onSuccess: refresh,
  })
}

export function useCreateKitchen() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (payload) => api.post('/platform/kitchens', payload),
    onSuccess: refresh,
  })
}

export function useKitchenMenu(kitchenId) {
  return useQuery({
    queryKey: qk.kitchenMenu(kitchenId),
    queryFn: () => api.get(`/kitchens/${kitchenId}/menu/day`),
    enabled: Boolean(kitchenId),
  })
}

export function useCreateMenuItem() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ kitchenId, payload }) =>
      api.post(`/kitchens/${kitchenId}/menu`, payload),
    onSuccess: refresh,
  })
}
