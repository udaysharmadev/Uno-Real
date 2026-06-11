import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useGameStore } from '../store/useGameStore';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const useSocket = () => {
  const { 
    socket, 
    setSocket, 
    setRoom, 
    setPlayer, 
    setError, 
    setConnectionStatus 
  } = useGameStore();

  useEffect(() => {
    // Single instance check
    if (socket) return;

    setConnectionStatus('connecting');
    const newSocket = io(BACKEND_URL, {
      autoConnect: true,
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to backend:', newSocket.id);
      setConnectionStatus('connected');
      setError(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err);
      setConnectionStatus('error');
      setError('Unable to connect to game server. Please ensure the backend is running.');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnectionStatus('disconnected');
    });

    // Handle lobby/game state updates
    newSocket.on('joined-successfully', ({ room, player }) => {
      console.log('[Socket] Joined room successfully:', room.code, player);
      setRoom(room);
      setPlayer(player);
      setError(null);
    });

    newSocket.on('lobby-updated', (updatedRoom) => {
      console.log('[Socket] Lobby updated:', updatedRoom);
      setRoom(updatedRoom);
    });

    newSocket.on('error', (err: { message: string }) => {
      console.error('[Socket] Error from server:', err.message);
      setError(err.message);
    });

    setSocket(newSocket);

    // Persistent connection: We do not disconnect on unmount so the socket session
    // survives App Router transitions. We manually clean up when the user clicks 'Leave'.
  }, [socket, setSocket, setRoom, setPlayer, setError, setConnectionStatus]);

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

  return {
    socket,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
  };
};
