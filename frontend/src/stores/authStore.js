import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      
      setAuth: (user, accessToken, refreshToken) => {
        // Just set state, Zustand persist will save to localStorage automatically
        set({ user, accessToken, refreshToken })
      },
      
      logout: () => {
        // Clear Zustand state, persist will clear localStorage automatically
        set({ user: null, accessToken: null, refreshToken: null })
      },
      
      updateUser: (userData) => 
        set((state) => ({ user: { ...state.user, ...userData } })),
    }),
    {
      name: 'auth-storage',
    }
  )
)
