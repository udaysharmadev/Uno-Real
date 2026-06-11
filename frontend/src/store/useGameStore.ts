import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { Room, Player } from '../types/game';

interface GameState {
  socket: Socket | null;
  room: Room | null;
  player: Player | null;
  error: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  setSocket: (socket: Socket | null) => void;
  setRoom: (room: Room | null) => void;
  setPlayer: (player: Player | null) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  socket: null,
  room: null,
  player: null,
  error: null,
  connectionStatus: 'disconnected',

  setSocket: (socket) => set({ socket }),
  setRoom: (room) => set({ room }),
  setPlayer: (player) => set({ player }),
  setError: (error) => set({ error }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  reset: () => set({ room: null, player: null, error: null }),
}));
