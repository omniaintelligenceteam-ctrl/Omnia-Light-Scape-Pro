import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between py-3 group cursor-pointer" onClick={() => onChange(!checked)}>
      <span className="text-[11px] font-medium text-gray-400 group-hover:text-white transition-colors tracking-wide">{label}</span>
      <div
        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 ease-out border shadow-inner ${
          checked ? 'bg-[#F6B45A] border-[#F6B45A]' : 'bg-[#222] border-gray-700'
        }`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-all duration-300 ease-out ${
            checked ? 'translate-x-4 shadow-[0_0_10px_rgba(255,255,255,0.6)]' : 'translate-x-0'
          }`}
        />
      </div>
    </div>
  );
};