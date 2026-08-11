import React, { useState } from 'react';
import {
  Sparkles,
  Bell,
  Key,
  LogIn,
  LogOut,
  Search,
  User,
  Flame,
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  Compass,
  Map,
  FileCheck2,
  Video,
  BarChart3,
  Award
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface NavbarProps {
  onOpenNotifications: () => void;
  onOpenApiKeyModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNotifications,
  onOpenApiKeyModal,
  activeTab,
  setActiveTab
}) => {
  const { user, notifications, loginDemoUser, logout, apiKey } = useAppStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const navSections = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my-courses', label: 'My Courses', icon: BookOpen },
        { id: 'catalog', label: 'Course Catalog', icon: Compass }
      ]
    },
    {
      title: 'AI Career Tools',
      isAi: true,
      items: [
        { id: 'ai-recommendations', label: 'AI Course Recs', icon: Sparkles },
        { id: 'roadmap', label: 'AI Learning Roadmap', icon: Map },
        { id: 'resume-analyzer', label: 'AI Resume Analyzer', icon: FileCheck2 },
        { id: 'mock-interview', label: 'AI Mock Interview', icon: Video }
      ]
    },
    {
      title: 'Career & Stats',
      items: [
        { id: 'analytics', label: 'Progress Analytics', icon: BarChart3 },
        { id: 'profile', label: 'Certificates & Profile', icon: Award }
      ]
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between transition-all">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white lg:hidden cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-5 h-5 text-indigo-400" />
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-3 group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="text-left hidden sm:block">
              <h1 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                SkillSnap <span className="ai-gradient-text">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Career Readiness Platform</p>
            </div>
          </button>

          {/* Global Search Bar */}
          <div className="relative hidden md:block w-64 lg:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses, skills, roadmaps..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-4">
          {/* Streak Counter Pill */}
          {user && (
            <div 
              onClick={() => setActiveTab('analytics')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold cursor-pointer hover:bg-amber-500/20 transition-all"
              title="Current Learning Streak"
            >
              <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse" />
              <span>{user.learningStreak}d</span>
            </div>
          )}

          {/* AI Key Status Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              apiKey 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20' 
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
            }`}
            title="Configure Claude AI API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{apiKey ? 'AI API Active' : 'Configure AI Key'}</span>
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-600 transition-all cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg shadow-indigo-500/50">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* User Profile / Auth Toggle */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 focus:outline-none cursor-pointer"
              >
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                  alt={user.name}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/30"
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Profile & Certificates</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => loginDemoUser()}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Demo</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Slide-Out Drawer Navigation */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-10 w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between h-full shadow-2xl animate-in slide-in-from-left duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-md">
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                  </div>
                  <h2 className="font-bold text-base text-white">SkillSnap AI</h2>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5 overflow-y-auto max-h-[70vh] pr-1">
                {navSections.map(section => (
                  <div key={section.title}>
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      {section.isAi && <Sparkles className="w-3 h-3 text-indigo-400" />}
                      {section.title}
                    </p>
                    <div className="space-y-1">
                      {section.items.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setShowMobileMenu(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Footer */}
            {user && (
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                    alt={user.name}
                    className="w-8 h-8 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
