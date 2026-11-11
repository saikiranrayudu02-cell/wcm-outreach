import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  user: any | null;
  setUser: (user: any | null) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  language: "en" | "hi" | "te";
  setLanguage: (lang: "en" | "hi" | "te") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      user: null,
      setUser: (user) => set({ user }),
      theme: "light",
      setTheme: (theme) => set({ theme }),
      language: "en",
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "wcm-ui-store",
      partialize: (state) => ({
        user: state.user,
        language: state.language,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
