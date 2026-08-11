import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  Sparkles,
  Map,
  FileCheck2,
  Video,
  BarChart3,
  Award
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-courses', label: 'My Courses', icon: BookOpen },
    { id: 'catalog', label: 'Course Catalog', icon: Compass }
  ];

  const aiNav = [
    { id: 'ai-recommendations', label: 'AI Course Recs', icon: Sparkles, isAi: true },
    { id: 'roadmap', label: 'AI Learning Roadmap', icon: Map, isAi: true },
    { id: 'resume-analyzer', label: 'AI Resume Analyzer', icon: FileCheck2, isAi: true },
    { id: 'mock-interview', label: 'AI Mock Interview', icon: Video, isAi: true }
  ];

  const analyticsNav = [
    { id: 'analytics', label: 'Progress Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Certificates & Profile', icon: Award }
  ];

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 flex flex-col justify-between hidden lg:flex shrink-0">
      <div className="space-y-6">
        {/* Core Navigation */}
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Overview</p>
          <div className="space-y-1">
            {mainNav.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Readiness Tools */}
        <div>
          <div className="px-3 flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              AI Career Tools
            </p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">PRO</span>
          </div>
          <div className="space-y-1">
            {aiNav.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/25 to-purple-600/20 border border-indigo-500/40 text-purple-300 shadow-lg shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/20'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress & Profile */}
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Career & Stats</p>
          <div className="space-y-1">
            {analyticsNav.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Career Readiness Card */}
      <div className="ai-gradient-bg p-3.5 rounded-2xl border border-indigo-500/30 text-center">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600/30 mx-auto mb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
        <h4 className="text-xs font-bold text-white mb-1">Career Job Readiness</h4>
        <div className="w-full bg-slate-800/80 rounded-full h-2 mb-2 overflow-hidden border border-indigo-500/20">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full w-[78%]" />
        </div>
        <p className="text-[11px] text-indigo-300 font-bold mb-2">78% Match for Target Role</p>
        <button
          onClick={() => setActiveTab('resume-analyzer')}
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition-all shadow-md shadow-indigo-600/30"
        >
          Check Skill Gaps
        </button>
      </div>
    </aside>
  );
};
