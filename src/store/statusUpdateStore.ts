import type { TwitterStatus } from '@/types/twitter';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type StatusUpdateState = {
  statuses: Record<string, TwitterStatus[]>;
  addStatusUpdate: (userId: string, status: TwitterStatus) => void;
  clearStatusUpdates: (userId: string) => void;
  clearAllStatusUpdates: () => void;
};

export const useStatusUpdateStore = create<StatusUpdateState>()(
  persist(
    set => ({
      statuses: {},
      addStatusUpdate: (userId, status) => set((state) => {
        const arr = state.statuses[userId] || [];
        if (arr.some(s => s.id === status.id)) {
          return {};
        }
        return {
          statuses: {
            ...state.statuses,
            [userId]: [status, ...arr],
          },
        };
      }),
      clearStatusUpdates: userId => set((state) => {
        const statuses = { ...state.statuses };
        delete statuses[userId];
        return { statuses };
      }),
      clearAllStatusUpdates: () => set({ statuses: {} }),
    }),
    {
      name: 'status-updates-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ statuses: state.statuses }),
    },
  ),
);
