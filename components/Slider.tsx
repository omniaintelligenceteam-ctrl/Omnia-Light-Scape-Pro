import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min = 0, max = 100, onChange }) => {
  return (
    <div className="py-4">
      <div className="flex justify-between mb-4">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em]">{label}</span>
        <span className="text-[10px] font-mono text-white font-medium tracking-tight">{value}%</span>
      </div>
      <div className="relative w-full h-[2px] bg-[#222] rounded-full group cursor-pointer flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-4 -top-2 opacity-0 cursor-pointer z-10"
        />
        {/* Track Fill */}
        <div 
          className="absolute h-full bg-[#F6B45A] rounded-full transition-all duration-150"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
        {/* Thumb */}
        <div 
           className="absolute h-3.5 w-3.5 bg-white border border-[#F6B45A] shadow-[0_0_0_4px_rgba(246,180,90,0.15)] rounded-full top-1/2 -translate-y-1/2 transition-all duration-200 pointer-events-none group-hover:scale-110 group-hover:shadow-[0_0_0_6px_rgba(246,180,90,0.1)]"
           style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 7px)` }}
        />
      </div>
    </div>
  );
};