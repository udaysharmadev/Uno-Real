'use client';

import React from 'react';
import { Crown } from 'lucide-react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isHost?: boolean;
  isLocal?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  isHost = false,
  isLocal = false,
  className = '',
}) => {
  // Extract initial
  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';

  // Hash function to get a consistent index for colors
  const hashName = (str: string) => {
    let hash = 0;
    if (!str) return hash;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  // Select a premium color gradient palette based on name hash
  const getPalette = (str: string) => {
    const hash = hashName(str);
    const palettes = [
      { bg: 'from-blue-600 to-indigo-900', text: 'text-blue-100', glow: 'shadow-blue-500/20' },
      { bg: 'from-violet-600 to-fuchsia-950', text: 'text-violet-100', glow: 'shadow-violet-500/20' },
      { bg: 'from-emerald-600 to-teal-950', text: 'text-emerald-100', glow: 'shadow-emerald-500/20' },
      { bg: 'from-rose-600 to-orange-950', text: 'text-rose-100', glow: 'shadow-rose-500/20' },
      { bg: 'from-cyan-600 to-blue-950', text: 'text-cyan-100', glow: 'shadow-cyan-500/20' },
      { bg: 'from-amber-600 to-red-950', text: 'text-amber-100', glow: 'shadow-amber-500/20' },
    ];
    return palettes[hash % palettes.length];
  };

  const palette = getPalette(name);

  // Size mapping
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg font-bold',
    xl: 'w-20 h-20 text-2xl font-bold',
  };

  // Ring mapping
  const ringColor = isLocal 
    ? 'ring-2 ring-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.4)]' 
    : isHost
      ? 'ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
      : 'ring-2 ring-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.3)]';

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      {/* Circle Initial Badge */}
      <div className={`rounded-full bg-gradient-to-br ${palette.bg} ${palette.text} ${sizeClasses[size]} ${ringColor} flex items-center justify-center font-bold tracking-wide relative overflow-hidden transition-all duration-300`}>
        {/* Subtle internal shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/5 pointer-events-none" />
        {initial}
      </div>

      {/* Floating Crown Badge for Host */}
      {isHost && (
        <div className={`absolute -top-1.5 -right-1 bg-gradient-to-r from-amber-500 to-yellow-400 border border-amber-300/40 text-slate-950 rounded-full p-0.5 shadow-md ${
          size === 'sm' ? 'scale-75 -top-2 -right-2' : ''
        }`}>
          <Crown size={size === 'xl' ? 14 : size === 'lg' ? 12 : 10} className="fill-current" />
        </div>
      )}
    </div>
  );
};
