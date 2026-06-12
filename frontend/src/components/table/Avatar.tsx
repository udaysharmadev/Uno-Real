'use client';

import React from 'react';
import { Crown } from 'lucide-react';

export interface AvatarConfig {
  type?: 'stylized' | 'image' | 'video';
  imageUrl?: string;
  videoStream?: MediaStream;
  isSpeaking?: boolean;
  reactionEmoji?: string;
}

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isHost?: boolean;
  isLocal?: boolean;
  className?: string;
  config?: AvatarConfig;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  isHost = false,
  isLocal = false,
  className = '',
  config,
}) => {
  // Hash function to consistently select features based on name
  const hashName = (str: string) => {
    let hash = 0;
    if (!str) return hash;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const hash = hashName(name);

  // Shirt gradient colors
  const shirts = [
    'from-blue-500 to-indigo-750',
    'from-emerald-500 to-teal-800',
    'from-rose-500 to-red-800',
    'from-amber-500 to-amber-800',
    'from-violet-500 to-indigo-900',
    'from-cyan-500 to-blue-800',
  ];
  const shirtColor = shirts[hash % shirts.length];

  // Skin tones
  const skinTones = ['#fbcfe8', '#fecaca', '#ffedd5', '#fed7aa', '#fde68a', '#ffccd5'];
  const skinTone = skinTones[hash % skinTones.length];

  // Hair styles (background color, border-radius styling, dimensions, absolute top offset)
  const hairStyles = [
    { bg: '#292524', rounded: 'rounded-t-full h-4 w-10 -top-2' }, // short black
    { bg: '#78350f', rounded: 'rounded-t-[40%] rounded-b-none h-5 w-9 -top-1.5' }, // dark brown sleek
    { bg: '#d97706', rounded: 'rounded-t-full h-3 w-10 -top-2' }, // ginger spiky
    { bg: '#a3a3a3', rounded: 'rounded-t-[50%] h-4.5 w-10 -top-1.5' }, // silver bob
    { bg: '#1e1b4b', rounded: 'rounded-full h-6 w-9 -top-2.5' }, // indigo bob
  ];
  const hair = hairStyles[hash % hairStyles.length];

  // Eye styles
  const eyesStyles = [
    { x: 'w-1.5 h-1.5 rounded-full bg-slate-900', offset: 'gap-3' },
    { x: 'w-1.5 h-1 bg-slate-900 rounded-full', offset: 'gap-3.5' },
    { x: 'w-1.5 h-1.5 rounded-full bg-slate-900', offset: 'gap-2.5' }
  ];
  const eyes = eyesStyles[hash % eyesStyles.length];

  // Mouth style
  const mouthStyles = [
    'w-3 h-1.5 border-b-2 border-slate-900 rounded-b-full mt-1', // smile
    'w-2 h-2 rounded-full bg-slate-900/80 mt-1.5', // cute circle o_o
    'w-2.5 h-1 border-b-2 border-slate-900 rounded-b-sm mt-1' // flat smirk
  ];
  const mouth = mouthStyles[hash % mouthStyles.length];

  // Scale factor based on size prop
  const scaleFactor = {
    sm: 0.65,
    md: 1.0,
    lg: 1.35,
    xl: 1.7,
  }[size];

  // Speaking indicator pulse glow
  const isSpeaking = config?.isSpeaking || false;
  const speakRing = isSpeaking
    ? 'ring-4 ring-green-400 animate-pulse shadow-[0_0_15px_rgba(74,222,128,0.8)]'
    : isLocal
      ? 'ring-2 ring-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.4)]'
      : isHost
        ? 'ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
        : 'ring-2 ring-indigo-500/80 shadow-[0_0_10px_rgba(99,102,241,0.3)]';

  return (
    <div 
      className={`relative flex flex-col items-center justify-end select-none shrink-0 ${className}`}
      style={{
        width: `${60 * scaleFactor}px`,
        height: `${68 * scaleFactor}px`,
      }}
    >
      <div 
        className="flex flex-col items-center justify-end w-[60px] h-[68px] origin-bottom"
        style={{ transform: `scale(${scaleFactor})` }}
      >
        {/* Render profile image or video stream if configured for future media integrations */}
        {config?.type === 'image' && config?.imageUrl ? (
          <div className={`w-12 h-12 rounded-full overflow-hidden bg-slate-800 ${speakRing}`}>
            <img src={config.imageUrl} alt={name} className="w-full h-full object-cover" />
          </div>
        ) : config?.type === 'video' ? (
          <div className={`w-12 h-12 rounded-full overflow-hidden bg-slate-900 ${speakRing} flex items-center justify-center`}>
            <span className="text-[10px] text-slate-500">Video</span>
          </div>
        ) : (
          /* Default: Stylized Human Avatar (Mii / Rec Room style) */
          <>
            {/* 1. Head */}
            <div 
              className={`w-8 h-8 rounded-full shadow-md relative flex flex-col items-center justify-center z-10 transition-transform duration-300 ${speakRing}`}
              style={{ backgroundColor: skinTone }}
            >
              {/* Hair Overlay */}
              <div 
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  backgroundColor: hair.bg,
                  borderRadius: hair.rounded.split(' ')[0],
                  height: hair.rounded.split(' ')[1],
                  width: hair.rounded.split(' ')[2],
                  top: hair.rounded.split(' ')[3],
                }}
              />
              
              {/* Face Elements */}
              <div className="flex flex-col items-center mt-1 z-20">
                {/* Eyes */}
                <div className={`flex justify-center ${eyes.offset}`}>
                  <div className={eyes.x} />
                  <div className={eyes.x} />
                </div>
                {/* Mouth */}
                <div className={mouth} />
              </div>
            </div>

            {/* 2. Neck */}
            <div 
              className="w-2.5 h-1.5 -mt-0.5 z-0" 
              style={{ backgroundColor: skinTone }}
            />

            {/* 3. Shoulders / Torso */}
            <div className={`w-12 h-8 rounded-t-xl bg-gradient-to-b ${shirtColor} border-t border-white/10 shadow-sm relative z-0 flex items-center justify-center overflow-hidden`}>
              {/* Shirt Accent Stripe */}
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              {/* Name initial logo label */}
              <span className="text-[7.5px] font-black tracking-widest text-white/30 uppercase mt-0.5">
                {name.trim().charAt(0)}
              </span>
            </div>
          </>
        )}

        {/* 4. Host Crown Indicator */}
        {isHost && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 border border-amber-300/40 text-slate-950 rounded-full p-0.5 shadow-md z-30 scale-90 animate-bounce">
            <Crown size={9} className="fill-current" />
          </div>
        )}
        
        {/* Animated speaking bubble/visual cue future overlay */}
        {config?.reactionEmoji && (
          <div className="absolute -top-6 -right-2 bg-slate-900/90 border border-slate-800 text-sm px-1 rounded shadow-md z-35 animate-bounce">
            {config.reactionEmoji}
          </div>
        )}
      </div>
    </div>
  );
};

export default Avatar;
