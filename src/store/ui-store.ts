import { create } from "zustand";

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

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  user: null,
  setUser: (user) => set({ user }),
  theme: "light",
  setTheme: (theme) => set({ theme }),
  language: "en",
  setLanguage: (language) => set({ language }),
}));
