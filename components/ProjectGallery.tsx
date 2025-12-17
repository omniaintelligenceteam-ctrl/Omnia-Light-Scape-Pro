
import React from 'react';
import { Project } from '../types';
import { Calendar, Trash2, DollarSign, Plus } from 'lucide-react';

interface ProjectGalleryProps {
  projects: Project[];
  onSelectProject: (project: Project, view?: 'editor' | 'quotes') => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({ projects, onSelectProject, onDeleteProject }) => {
  if (projects.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-[#FDFCFB]">
        <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 flex items-center justify-center mb-6 shadow-xl shadow-black/5">
          <Calendar size={28} className="opacity-30" />
        </div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No saved projects yet</p>
        <p className="text-xs mt-2 text-gray-300">Generate a design and save it to see it here.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-12 pb-12 bg-[#FDFCFB]">
      <h2 className="text-3xl font-bold tracking-tight mb-8 mt-10 text-[#111]">Saved Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="group bg-white rounded-[24px] overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-gray-100 hover:border-[#F6B45A]/30 hover:shadow-[0_25px_50px_-12px_rgba(246,180,90,0.15)] transition-all duration-500 flex flex-col transform hover:-translate-y-1"
          >
            <div className="h-56 flex flex-row relative">
                {/* Left Side: Design (After Image) */}
                <div 
                    className="w-1/2 h-full relative border-r border-gray-100 cursor-pointer group/image overflow-hidden"
                    onClick={() => onSelectProject(project, 'editor')}
                >
                    <img 
                        src={project.outputImage} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-110" 
                        alt="Designed" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
                         <span className="opacity-0 group-hover/image:opacity-100 bg-white/90 text-[#111] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transform translate-y-2 group-hover/image:translate-y-0 transition-all shadow-lg">
                            View Design
                         </span>
                    </div>
                    <span className="absolute bottom-2 left-2 text-[8px] font-bold text-[#F6B45A] uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded-full backdrop-blur-sm border border-[#F6B45A]/20">
                        Design
                    </span>
                </div>

                {/* Right Side: Quote */}
                <div 
                    className="w-1/2 h-full relative bg-gray-50 flex flex-col items-center justify-center p-4 cursor-pointer group/quote hover:bg-gray-100 transition-colors"
                    onClick={() => onSelectProject(project, 'quotes')}
                >
                    {project.quote ? (
                        <div className="text-center">
                             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 mx-auto text-green-600 group-hover/quote:scale-110 transition-transform">
                                <DollarSign size={18} />
                             </div>
                             <p className="text-xl font-bold text-[#111] tracking-tight">
                                ${project.quote.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                             </p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                {project.quote.items.length} Line Items
                             </p>
                             <span className={`inline-block mt-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
                                project.quote.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : 
                                project.quote.status === 'sent' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                'bg-gray-200 text-gray-600 border-gray-300'
                             }`}>
                                {project.quote.status}
                             </span>
                        </div>
                    ) : (
                        <div className="text-center opacity-60 group-hover/quote:opacity-100 transition-opacity">
                             <div className="w-10 h-10 bg-white border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-3 mx-auto text-gray-400">
                                <Plus size={18} />
                             </div>
                             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Create Quote
                             </p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-[#111] text-sm tracking-tight leading-snug line-clamp-2">{project.name}</h3>
                </div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                   <span>{project.date}</span>
                </p>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{project.settings.ambientLight > 50 ? 'Daylight' : 'Night Scene'}</span>
                </div>
                <button 
                  onClick={() => onDeleteProject(project.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Delete Project"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
