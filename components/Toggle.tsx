import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  dark?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange, dark = true }) => {
  const textColor = dark 
    ? 'text-gray-400 group-hover:text-white' 
    : 'text-gray-500 group-hover:text-[#111]';

  const trackBg = checked 
    ? 'bg-[#F6B45A] border-[#F6B45A]' 
    : (dark ? 'bg-[#222] border-gray-700' : 'bg-gray-200 border-gray-300');

  const thumbBg = 'bg-white'; // Thumb always white works well

  return (
    <div className="flex items-center justify-between py-3 group cursor-pointer" onClick={() => onChange(!checked)}>
      <span className={`text-[11px] font-medium transition-colors tracking-wide ${textColor}`}>{label}</span>
      <div
        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 ease-out border shadow-inner ${trackBg}`}
      >
        <div
          className={`${thumbBg} w-4 h-4 rounded-full shadow-sm transform transition-all duration-300 ease-out ${
            checked ? 'translate-x-4 shadow-[0_0_10px_rgba(255,255,255,0.6)]' : 'translate-x-0'
          }`}
        />
      </div>
    </div>
  );
};