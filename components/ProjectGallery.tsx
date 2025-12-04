import React from 'react';
import { Project } from '../types';
import { Calendar, Trash2, ArrowRight } from 'lucide-react';

interface ProjectGalleryProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
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
            <div className="h-56 overflow-hidden relative cursor-pointer" onClick={() => onSelectProject(project)}>
              <div className="absolute inset-0 flex">
                <div className="w-1/2 h-full relative border-r border-white/10">
                   <img src={project.inputImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Original" />
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                   <span className="absolute bottom-2 left-2 text-[8px] font-bold text-white/70 uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">Before</span>
                </div>
                <div className="w-1/2 h-full relative">
                   <img src={project.outputImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Designed" />
                   <span className="absolute bottom-2 right-2 text-[8px] font-bold text-[#F6B45A] uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded-full backdrop-blur-sm border border-[#F6B45A]/20">After</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                 <span className="bg-white text-[#111] px-6 py-3 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    Open Project <ArrowRight size={12} />
                 </span>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-[#111] text-sm tracking-tight leading-snug line-clamp-2">{project.name}</h3>
                </div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-4">
                   {project.date} • {project.markers.length} Fixtures
                </p>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{project.settings.ambientLight > 50 ? 'Daylight' : 'Night Scene'}</span>
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