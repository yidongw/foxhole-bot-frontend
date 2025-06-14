import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

type AuthState = {
  token: string | null;
  clientId: string;
  setToken: (token: string | null) => void;
  setClientId: (clientId: string) => void;
};

export const useAuthStore = create<AuthState>(set => ({
  token: null,
  clientId: uuidv4(), // Generate a default UUID
  setToken: token => set({ token }),
  setClientId: clientId => set({ clientId }),
}));
