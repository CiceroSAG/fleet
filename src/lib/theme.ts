import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (isDark) => set({ isDarkMode: isDark }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
