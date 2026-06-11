'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { getSeatCoords } from '../../utils/seating';
import { useSocket } from '../../hooks/useSocket';

const EMOJIS = ['😂', '😭', '🔥', '😡', '😱', '👏', '💀'];

export const ReactionsHandler: React.FC = () => {
  const { 
    room, 
    player, 
    reactions, 
    removeReaction 
  } = useGameStore();

  const { socket } = useSocket();

  const localSeatNumber = player?.seatNumber || 1;
  const playersList = room?.players || [];
  const numPlayers = playersList.length || 2;
  const localIndex = room ? playersList.findIndex(p => p.id === player?.id) : -1;

  // Emit reaction socket event
  const sendEmoji = (emoji: string) => {
    if (socket) {
      socket.emit('send-reaction', { emoji });
    }
  };

  return (
    <>
      {/* =================================================================== */}
      {/* Floating Reactions Render Layer                                     */}
      {/* =================================================================== */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        <AnimatePresence>
          {reactions.map((reaction) => {
            // Self-destroy after 2.5 seconds
            return (
              <ReactionBubble
                key={reaction.id}
                reaction={reaction}
                localSeatNumber={localSeatNumber}
                numPlayers={numPlayers}
                localIndex={localIndex}
                playersList={playersList}
                roomStatus={room?.status || 'lobby'}
                onComplete={() => removeReaction(reaction.id)}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* =================================================================== */}
      {/* Emojis Selector Bar (Bottom Right Panel HUD overlay)               */}
      {/* =================================================================== */}
      <div className="fixed bottom-24 right-4 z-30 flex flex-col items-center gap-1.5 pointer-events-auto bg-slate-950/80 border border-slate-900 px-2.5 py-2 rounded-2xl backdrop-blur-md shadow-2xl">
        <span className="text-[7px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
          Reactions
        </span>
        <div className="flex gap-1">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendEmoji(emoji)}
              className="text-lg hover:scale-125 transition-transform duration-150 active:scale-95 leading-none select-none p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// Helper component to handle auto-destroy timer and coordinates
interface ReactionBubbleProps {
  reaction: {
    id: string;
    name: string;
    seatNumber: number | null;
    emoji: string;
    isSpectator: boolean;
  };
  localSeatNumber: number;
  numPlayers: number;
  localIndex: number;
  playersList: any[];
  roomStatus: string;
  onComplete: () => void;
}

const ReactionBubble: React.FC<ReactionBubbleProps> = ({
  reaction,
  localSeatNumber,
  numPlayers,
  localIndex,
  playersList,
  roomStatus,
  onComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // If spectator reaction, render as a floating toast from bottom center
  if (reaction.isSpectator || reaction.seatNumber === null) {
    return (
      <motion.div
        initial={{ y: 50, x: '-50%', opacity: 0, scale: 0.8 }}
        animate={{ y: -160, x: '-50%', opacity: 1, scale: 1 }}
        exit={{ opacity: 0, y: -220 }}
        transition={{ duration: 2.2, ease: 'easeOut' }}
        className="absolute left-1/2 bottom-12 px-3.5 py-1.5 bg-slate-900/90 border border-slate-800 rounded-full shadow-2xl flex items-center gap-2"
      >
        <span className="text-[9px] font-bold text-slate-400">
          👓 Spectator {reaction.name}:
        </span>
        <span className="text-base leading-none select-none">{reaction.emoji}</span>
      </motion.div>
    );
  }

  // Get coords of player seat
  let coords = { left: '50%', top: '88%', rotation: 0 };
  if (roomStatus === 'playing') {
    const playerIndex = playersList.findIndex(p => p.seatNumber === reaction.seatNumber);
    if (playerIndex !== -1 && localIndex !== -1) {
      const visualSlotIndex = (playerIndex - localIndex + numPlayers) % numPlayers;
      coords = getSeatCoords(visualSlotIndex, 0, numPlayers);
    }
  } else {
    coords = getSeatCoords(reaction.seatNumber, localSeatNumber, 6);
  }

  return (
    <motion.div
      initial={{ scale: 0.3, y: 10, opacity: 0 }}
      animate={{ scale: [1, 1.3, 1], y: -55, opacity: 1 }}
      exit={{ opacity: 0, y: -85, scale: 0.8 }}
      transition={{ duration: 2.0, ease: 'easeOut' }}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none"
      style={{
        left: coords.left,
        top: coords.top,
      }}
    >
      {/* Floating Emoji bubble */}
      <div className="bg-slate-900/90 border border-slate-800 shadow-2xl p-2 rounded-full flex items-center justify-center scale-110">
        <span className="text-xl leading-none">{reaction.emoji}</span>
      </div>
      {/* Mini name pointer */}
      <div className="mt-1 bg-slate-950/80 border border-slate-900 px-1.5 py-0.5 rounded-md">
        <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider">
          {reaction.name}
        </span>
      </div>
    </motion.div>
  );
};
