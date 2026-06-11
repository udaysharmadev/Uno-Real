import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/useGameStore';
import { CardColor, CardItem } from '../lib/cards/cardEngine';
import { soundManager } from '../utils/soundManager';
import { getSeatCoords } from '../utils/seating';

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
    setIsProcessing,
    setIsSpectator,
    addReaction
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

    // Transition animator to compare incoming payload and trigger visual card flights
    const handleGameUpdateAnimation = (payload: any) => {
      const state = useGameStore.getState();
      const localSeat = state.player?.seatNumber || 1;
      const playersList = state.room?.players || [];
      const numPlayers = playersList.length || 2;
      const localIndex = state.room ? playersList.findIndex(p => p.id === state.player?.id) : -1;

      // Helper to retrieve screen percentage coordinates of any seat
      const getCoordsForSeat = (seatNo: number) => {
        const playerIndex = playersList.findIndex(p => p.seatNumber === seatNo);
        if (playerIndex !== -1 && localIndex !== -1) {
          const visualSlotIndex = (playerIndex - localIndex + numPlayers) % numPlayers;
          return getSeatCoords(visualSlotIndex, 0, numPlayers);
        }
        return getSeatCoords(seatNo, localSeat, 6);
      };

      // If initial state load, merge immediately to prevent massive simultaneous fly-in overlaps
      const isInitialLoad = state.discardPile.length === 0 && payload.discardPile.length > 0 && state.drawPileCount === 52;

      if (isInitialLoad) {
        setGameState(payload);
        return;
      }

      // Check Discard Pile change (Card Played)
      const oldDiscard: CardItem[] = state.discardPile;
      const newDiscard: CardItem[] = payload.discardPile;
      let cardPlayAnimated = false;

      if (newDiscard.length > oldDiscard.length) {
        const playedCard: CardItem = newDiscard[newDiscard.length - 1];
        
        // Find which player's card count decreased to see who threw it
        let playerWhoPlayedSeat = -1;
        for (const player of playersList) {
          const seat = player.seatNumber;
          const oldCount = state.playerCards[seat]?.length || 0;
          const newCount = payload.hands[seat]?.length || 0;
          if (newCount < oldCount) {
            playerWhoPlayedSeat = seat;
            break;
          }
        }

        // Animate flight if it was an opponent
        // (Local player card plays are animated optimistically in page.tsx)
        if (playerWhoPlayedSeat !== -1 && playerWhoPlayedSeat !== localSeat) {
          const coords = getCoordsForSeat(playerWhoPlayedSeat);
          const animator = (window as any).triggerHtmlCardAnimation;
          
          if (animator) {
            cardPlayAnimated = true;
            animator(
              playedCard.color,
              playedCard.value,
              coords.left,
              coords.top,
              '59%', // Discard Pile X
              '50%', // Discard Pile Y
              coords.rotation,
              0, // end rotation
              0.6, // start scale
              0.72, // end scale
              true, // face up
              () => {
                soundManager.play('card_play');
                // Synchronize discard pile & hands
                useGameStore.setState({
                  playerCards: payload.hands,
                  discardPile: payload.discardPile,
                  drawPileCount: payload.drawPileCount
                });
              }
            );
          }
        }
      }

      // Check Hands changes (Cards Drawn)
      let cardsDrawnAnimated = false;
      for (const player of playersList) {
        const seat = player.seatNumber;
        const oldHand: CardItem[] = state.playerCards[seat] || [];
        const newHand: CardItem[] = payload.hands[seat] || [];
        
        if (newHand.length > oldHand.length) {
          cardsDrawnAnimated = true;
          const addedCards = newHand.filter((nc: CardItem) => !oldHand.some((cc: CardItem) => cc.id === nc.id));
          const coords = getCoordsForSeat(seat);
          const animator = (window as any).triggerHtmlCardAnimation;
          
          addedCards.forEach((card, idx) => {
            const delay = idx * 200; // stagger multiple draws
            setTimeout(() => {
              if (animator) {
                animator(
                  seat === localSeat ? card.color : 'wild',
                  seat === localSeat ? card.value : 'wild',
                  '41%', // Draw Pile X
                  '50%', // Draw Pile Y
                  coords.left,
                  coords.top,
                  0,
                  coords.rotation,
                  0.72, // start scale
                  seat === localSeat ? 1.0 : 0.6, // end scale
                  seat === localSeat, // face up for local player only
                  () => {
                    soundManager.play('card_draw');
                    // Add this specific card to storeplayerCards
                    const currentHand = useGameStore.getState().playerCards[seat] || [];
                    if (!currentHand.some(h => h.id === card.id)) {
                      useGameStore.setState({
                        playerCards: {
                          ...useGameStore.getState().playerCards,
                          [seat]: [...currentHand, card]
                        },
                        drawPileCount: payload.drawPileCount
                      });
                    }
                  }
                );
              } else {
                setGameState(payload);
              }
            }, delay);
          });
        }
      }

      // If no card animation was triggered, update immediately
      if (!cardPlayAnimated && !cardsDrawnAnimated) {
        setGameState(payload);
      } else {
        // Sync non-card states immediately
        useGameStore.setState({
          currentPlayerId: payload.currentPlayerId,
          currentPlayerSeat: payload.currentPlayerSeat,
          direction: payload.direction,
          wildColor: payload.wildColor,
          gameStatus: payload.gameStatus,
          colorChooserId: payload.colorChooserId,
          winnerId: payload.winnerId,
          winnerName: payload.winnerName,
          unoCalled: payload.unoCalled
        });
      }
    };

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
    socketInstance.on('joined-successfully', ({ room, player, isSpectator }) => {
      console.log('[Socket] Joined room successfully:', room?.code, player, 'isSpectator:', isSpectator);
      setRoom(room);
      setPlayer(player);
      setIsSpectator(!!isSpectator);
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
      handleGameUpdateAnimation(payload);
      setIsProcessing(false);
    });

    socketInstance.off('game-ended');
    socketInstance.on('game-ended', ({ winnerId, winnerName }) => {
      console.log('[Socket] Game ended. Winner:', winnerName);
      soundManager.play('victory');
      setIsProcessing(false);
    });

    socketInstance.off('error');
    socketInstance.on('error', (err: { message: string }) => {
      console.error('[Socket] Error from server:', err.message);
      setError(err.message);
      setIsProcessing(false);
    });

    socketInstance.off('player-reacted');
    socketInstance.on('player-reacted', ({ name, seatNumber, emoji, isSpectator }) => {
      console.log('[Socket] Player reacted:', name, emoji);
      soundManager.play('reaction');
      addReaction({
        id: `reaction-${Math.random().toString(36).substring(2, 9)}`,
        name,
        seatNumber,
        emoji,
        isSpectator: !!isSpectator
      });
    });

    socketInstance.off('player-joined');
    socketInstance.on('player-joined', (newPlayer) => {
      console.log('[Socket] Player joined:', newPlayer?.name);
      soundManager.play('player_join');
    });

    socketInstance.off('player-left');
    socketInstance.on('player-left', (leftPlayer) => {
      console.log('[Socket] Player left:', leftPlayer?.name);
      soundManager.play('player_leave');
    });

    socketInstance.off('spectator-joined');
    socketInstance.on('spectator-joined', ({ name, id }) => {
      console.log('[Socket] Spectator joined:', name);
      soundManager.play('player_join');
    });

    socketInstance.off('spectator-left');
    socketInstance.on('spectator-left', ({ name, id }) => {
      console.log('[Socket] Spectator left:', name);
      soundManager.play('player_leave');
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
      socketInstance.off('player-reacted');
      socketInstance.off('player-joined');
      socketInstance.off('player-left');
      socketInstance.off('spectator-joined');
      socketInstance.off('spectator-left');
    };
    // stable setter dependencies
  }, [setSocket, setRoom, setPlayer, setError, setConnectionStatus, setGameState, setIsProcessing, setIsSpectator, addReaction]);

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
