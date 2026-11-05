import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const useSession = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'sbp-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
)

export function getSessionUser() {
  return useSession.getState().user
}
