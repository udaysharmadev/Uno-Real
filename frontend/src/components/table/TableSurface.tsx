'use client';

import React from 'react';

export const TableSurface: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      {/* 1. Large Wood Bezel Oval Table */}
      <div 
        className="w-[86%] h-[72%] rounded-[50%] border-[16px] border-[#201008] bg-[#0c1424] flex items-center justify-center relative"
        style={{
          boxShadow: `
            0 25px 60px rgba(0,0,0,0.85), 
            inset 0 4px 12px rgba(255,255,255,0.05),
            0 1px 2px rgba(255,255,255,0.1)
          `,
        }}
      >
        {/* 2. Gold Border Trim Line */}
        <div className="absolute inset-[1px] rounded-[50%] border-2 border-amber-600/50 pointer-events-none shadow-[inset_0_0_12px_rgba(217,119,6,0.25)]" />

        {/* 3. Outer Edge Chrome Rim Accent */}
        <div className="absolute inset-[3px] rounded-[50%] border border-slate-700/30 pointer-events-none" />

        {/* 4. Dark Blue Felt Surface with Radial Gradient */}
        <div 
          className="absolute inset-[4px] rounded-[50%] overflow-hidden"
          style={{
            background: 'radial-gradient(circle at center, #0f244c 0%, #07122a 60%, #020612 100%)'
          }}
        >
          {/* Subtle Felt Fabric Texture Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '8px 8px'
            }}
          />

          {/* Soft neon blue felt inner border glow line */}
          <div className="absolute inset-8 rounded-[50%] border border-blue-500/10 shadow-[inset_0_0_30px_rgba(59,130,246,0.15)] pointer-events-none" />

          {/* Center Table Vignette shadow */}
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.7)] pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default TableSurface;

