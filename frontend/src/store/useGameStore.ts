import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { Room, Player } from '../types/game';
import { CardItem, CardColor } from '../lib/cards/cardEngine';

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
  isProcessing: boolean;

  // Active UNO Game Engine States
  currentPlayerId: string | null;
  currentPlayerSeat: number | null;
  direction: 'clockwise' | 'counter-clockwise' | null;
  wildColor: CardColor | null;
  gameStatus: 'lobby' | 'playing' | 'awaiting_color_selection' | 'ended';
  colorChooserId: string | null;
  winnerId: string | null;
  winnerName: string | null;
  unoCalled: Record<string, boolean>; // socketId -> boolean
  isSpectator: boolean;
  reactions: Array<{ id: string; name: string; seatNumber: number | null; emoji: string; isSpectator: boolean }>;
  
  setSocket: (socket: Socket | null) => void;
  setIsProcessing: (val: boolean) => void;
  setIsSpectator: (val: boolean) => void;
  addReaction: (reaction: { id: string; name: string; seatNumber: number | null; emoji: string; isSpectator: boolean }) => void;
  removeReaction: (id: string) => void;
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
  
  // Game state bulk updater
  setGameState: (payload: {
    hands: Record<number, CardItem[]>;
    discardPile: CardItem[];
    drawPileCount: number;
    currentPlayerId: string;
    currentPlayerSeat: number;
    direction: 'clockwise' | 'counter-clockwise';
    wildColor: CardColor | null;
    gameStatus: 'playing' | 'awaiting_color_selection' | 'ended';
    colorChooserId: string | null;
    winnerId: string | null;
    winnerName: string | null;
    unoCalled: Record<string, boolean>;
  }) => void;
  
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
  isProcessing: false,

  // Active UNO Game Engine defaults
  currentPlayerId: null,
  currentPlayerSeat: null,
  direction: 'clockwise',
  wildColor: null,
  gameStatus: 'lobby',
  colorChooserId: null,
  winnerId: null,
  winnerName: null,
  unoCalled: {},
  isSpectator: false,
  reactions: [],

  setSocket: (socket) => set({ socket }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setIsSpectator: (isSpectator) => set({ isSpectator }),
  addReaction: (reaction) => set((state) => ({ reactions: [...state.reactions, reaction] })),
  removeReaction: (id) => set((state) => ({ reactions: state.reactions.filter(r => r.id !== id) })),
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
    selectedCardId: null,
    isProcessing: false,
    isSpectator: false,
    reactions: [],
    currentPlayerId: null,
    currentPlayerSeat: null,
    wildColor: null,
    gameStatus: 'lobby',
    colorChooserId: null,
    winnerId: null,
    winnerName: null,
    unoCalled: {},
  }),

  setGameState: (payload) => set((state) => ({
    playerCards: payload.hands,
    discardPile: payload.discardPile,
    drawPileCount: payload.drawPileCount,
    currentPlayerId: payload.currentPlayerId,
    currentPlayerSeat: payload.currentPlayerSeat,
    direction: payload.direction,
    wildColor: payload.wildColor,
    gameStatus: payload.gameStatus,
    colorChooserId: payload.colorChooserId,
    winnerId: payload.winnerId,
    winnerName: payload.winnerName,
    unoCalled: payload.unoCalled,
    isProcessing: false,
  })),

  reset: () => set({ 
    room: null, 
    player: null, 
    error: null, 
    cameraMode: 'seated',
    playerCards: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
    discardPile: [],
    drawPileCount: 52,
    selectedCardId: null,
    isProcessing: false,
    isSpectator: false,
    reactions: [],
    currentPlayerId: null,
    currentPlayerSeat: null,
    direction: 'clockwise',
    wildColor: null,
    gameStatus: 'lobby',
    colorChooserId: null,
    winnerId: null,
    winnerName: null,
    unoCalled: {},
  }),
}));

