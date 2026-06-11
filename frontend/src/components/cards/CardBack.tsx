'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export const CardBack: React.FC = () => {
  return (
    <div className="w-[124px] h-[184px] bg-slate-950 rounded-2xl border-2 border-slate-800 p-2 flex flex-col justify-between items-center relative overflow-hidden select-none shadow-[0_0_15px_rgba(0,0,0,0.7)]">
      {/* Background Gradient Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950 opacity-90" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />

      {/* Outer Neon Blue Board Line */}
      <div className="absolute inset-1.5 rounded-[10px] border border-blue-500/25 shadow-[inset_0_0_6px_rgba(59,130,246,0.15)] pointer-events-none" />

      {/* Decorative Top/Bottom Corner Symbols */}
      <div className="w-full flex justify-between px-1 text-[8px] font-extrabold tracking-widest text-blue-500/40 relative z-10">
        <span>UR</span>
        <span>UR</span>
      </div>

      {/* Center Logo Area */}
      <div className="flex flex-col items-center justify-center relative z-10 my-auto">
        {/* Holographic Glowing Ring */}
        <div className="w-14 h-14 rounded-full bg-slate-900/40 border border-blue-500/30 flex items-center justify-center relative shadow-[0_0_15px_rgba(59,130,246,0.25)]">
          {/* Pulsing neon center circle */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 shadow-inner flex items-center justify-center">
            <Sparkles size={14} className="text-white animate-pulse" />
          </div>
        </div>

        {/* Brand Text */}
        <span className="text-[10px] uppercase font-black tracking-widest text-slate-100 mt-2 bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-800/80">
          UNO Real
        </span>
      </div>

      {/* Bottom Corner Symbols */}
      <div className="w-full flex justify-between px-1 text-[8px] font-extrabold tracking-widest text-blue-500/40 relative z-10 rotate-180">
        <span>UR</span>
        <span>UR</span>
      </div>
    </div>
  );
};
export default CardBack;
