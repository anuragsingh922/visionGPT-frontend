import { create } from "zustand";

export const useZustandStore = create()((set) => ({
  chat: [],
  setchat: (newchat) => set({ chat: newchat }),
}));
