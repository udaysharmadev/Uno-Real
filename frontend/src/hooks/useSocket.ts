import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/useGameStore';
import { CardColor } from '../lib/cards/cardEngine';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Global singleton socket instance to prevent duplicate socket connections
let sharedSocket: Socket | null = null;

export const useSocket = () => {
  const { 
    socket, 
    setSocket, 
    setRoom, 
    setPlayer, 
    setError, 
    setConnectionStatus,
    setGameState,
    setIsProcessing
  } = useGameStore();

  useEffect(() => {
    // 1. Ensure socket creation happens only once (singleton pattern)
    if (!sharedSocket) {
      console.log('SOCKET_CREATED');
      sharedSocket = io(BACKEND_URL, {
        autoConnect: false,
        transports: ['websocket'],
      });
    }

    const socketInstance = sharedSocket;

    // 2. Attach listeners safely (cleaning up existing ones first to prevent duplicates)
    socketInstance.off('connect');
    socketInstance.on('connect', () => {
      console.log('SOCKET_CONNECTED', socketInstance.id);
      setConnectionStatus('connected');
      setError(null);
    });

    socketInstance.off('connect_error');
    socketInstance.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err);
      setConnectionStatus('error');
      setError('Unable to connect to game server. Please ensure the backend is running.');
      setIsProcessing(false);
    });

    socketInstance.off('disconnect');
    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnectionStatus('disconnected');
    });

    socketInstance.off('joined-successfully');
    socketInstance.on('joined-successfully', ({ room, player }) => {
      console.log('[Socket] Joined room successfully:', room?.code, player);
      setRoom(room);
      setPlayer(player);
      setError(null);
      setIsProcessing(false);
    });

    socketInstance.off('lobby-updated');
    socketInstance.on('lobby-updated', (updatedRoom) => {
      console.log('[Socket] Lobby updated:', updatedRoom);
      setRoom(updatedRoom);
      setIsProcessing(false);
    });

    socketInstance.off('game-updated');
    socketInstance.on('game-updated', (payload) => {
      console.log('[Socket] Game updated:', payload);
      setGameState(payload);
      setIsProcessing(false);
    });

    socketInstance.off('game-ended');
    socketInstance.on('game-ended', ({ winnerId, winnerName }) => {
      console.log('[Socket] Game ended. Winner:', winnerName);
      setIsProcessing(false);
    });

    socketInstance.off('error');
    socketInstance.on('error', (err: { message: string }) => {
      console.error('[Socket] Error from server:', err.message);
      setError(err.message);
      setIsProcessing(false);
    });

    // Connect if not already connected
    if (!socketInstance.connected) {
      setConnectionStatus('connecting');
      socketInstance.connect();
    }

    // 3. Verify setSocket() is only called when socket actually changes
    if (socket !== socketInstance) {
      console.log('SOCKET_STORED');
      setSocket(socketInstance);
    }

    // Cleanup: remove listeners to prevent duplicates
    return () => {
      console.log('[Socket] Cleaning up listeners for socket:', socketInstance.id);
      socketInstance.off('connect');
      socketInstance.off('connect_error');
      socketInstance.off('disconnect');
      socketInstance.off('joined-successfully');
      socketInstance.off('lobby-updated');
      socketInstance.off('game-updated');
      socketInstance.off('game-ended');
      socketInstance.off('error');
    };
    // stable setter dependencies (removes 'socket' dependency to avoid render feedback loop)
  }, [setSocket, setRoom, setPlayer, setError, setConnectionStatus, setGameState, setIsProcessing]);

  const createRoom = (name: string) => {
    if (socket) {
      socket.emit('create-room', { name });
    } else {
      console.warn('[Socket] Socket not initialized yet');
    }
  };

  const joinRoom = (code: string, name: string) => {
    if (socket) {
      socket.emit('join-room', { code, name });
    } else {
      console.warn('[Socket] Socket not initialized yet');
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave-room');
      setRoom(null);
      setPlayer(null);
      setError(null);
    }
  };

  const startGame = () => {
    if (socket) {
      socket.emit('start-game');
    }
  };

  const playCard = (cardId: string) => {
    if (socket) {
      socket.emit('play-card', { cardId });
    }
  };

  const drawCard = () => {
    if (socket) {
      socket.emit('draw-card');
    }
  };

  const chooseColor = (color: CardColor) => {
    if (socket) {
      socket.emit('choose-color', { color });
    }
  };

  const callUno = () => {
    if (socket) {
      socket.emit('call-uno');
    }
  };

  return {
    socket,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    playCard,
    drawCard,
    chooseColor,
    callUno,
  };
};

