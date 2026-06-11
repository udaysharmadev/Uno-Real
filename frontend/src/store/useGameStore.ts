import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { Room, Player } from '../types/game';
import { CardItem } from '../lib/cards/cardEngine';

interface GameState {
  socket: Socket | null;
  room: Room | null;
  player: Player | null;
  error: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  cameraMode: 'seated' | 'orbit';
  
  // Card Engine States
  playerCards: Record<number, CardItem[]>; // seatNumber -> CardItem[]
  discardPile: CardItem[];
  drawPileCount: number;
  selectedCardId: string | null;
  
  setSocket: (socket: Socket | null) => void;
  setRoom: (room: Room | null) => void;
  setPlayer: (player: Player | null) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
  setCameraMode: (mode: 'seated' | 'orbit') => void;
  
  // Card Actions
  setSelectedCardId: (id: string | null) => void;
  setPlayerCards: (seatNumber: number, cards: CardItem[]) => void;
  addCardToPlayer: (seatNumber: number, card: CardItem) => void;
  removeCardFromPlayer: (seatNumber: number, cardId: string) => void;
  playCardToDiscard: (seatNumber: number, cardId: string) => void;
  setDiscardPile: (cards: CardItem[]) => void;
  setDrawPileCount: (count: number) => void;
  clearAllCards: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  socket: null,
  room: null,
  player: null,
  error: null,
  connectionStatus: 'disconnected',
  cameraMode: 'seated',
  
  // Card defaults
  playerCards: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
  discardPile: [],
  drawPileCount: 52,
  selectedCardId: null,

  setSocket: (socket) => set({ socket }),
  setRoom: (room) => set({ room }),
  setPlayer: (player) => set({ player }),
  setError: (error) => set({ error }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  
  setSelectedCardId: (selectedCardId) => set({ selectedCardId }),
  setPlayerCards: (seatNumber, cards) => set((state) => ({
    playerCards: { ...state.playerCards, [seatNumber]: cards }
  })),
  addCardToPlayer: (seatNumber, card) => set((state) => {
    const existing = state.playerCards[seatNumber] || [];
    return {
      playerCards: { ...state.playerCards, [seatNumber]: [...existing, card] }
    };
  }),
  removeCardFromPlayer: (seatNumber, cardId) => set((state) => {
    const existing = state.playerCards[seatNumber] || [];
    return {
      playerCards: { ...state.playerCards, [seatNumber]: existing.filter(c => c.id !== cardId) }
    };
  }),
  playCardToDiscard: (seatNumber, cardId) => set((state) => {
    const hand = state.playerCards[seatNumber] || [];
    const cardToPlay = hand.find(c => c.id === cardId);
    if (!cardToPlay) return {};
    
    return {
      playerCards: { ...state.playerCards, [seatNumber]: hand.filter(c => c.id !== cardId) },
      discardPile: [...state.discardPile, cardToPlay],
      selectedCardId: state.selectedCardId === cardId ? null : state.selectedCardId
    };
  }),
  setDiscardPile: (discardPile) => set({ discardPile }),
  setDrawPileCount: (drawPileCount) => set({ drawPileCount }),
  clearAllCards: () => set({
    playerCards: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
    discardPile: [],
    drawPileCount: 52,
    selectedCardId: null
  }),
  reset: () => set({ 
    room: null, 
    player: null, 
    error: null, 
    cameraMode: 'seated',
    playerCards: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
    discardPile: [],
    drawPileCount: 52,
    selectedCardId: null
  }),
}));
