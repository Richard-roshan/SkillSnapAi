import React from 'react';
import { X, CheckCheck, Flame, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  setActiveTab
}) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'streak': return <Flame className="w-4 h-4 text-amber-400" />;
      case 'course': return <BookOpen className="w-4 h-4 text-indigo-400" />;
      case 'ai': return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'quiz': return <HelpCircle className="w-4 h-4 text-cyan-400" />;
      default: return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm text-white">Notification Center</h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                {notifications.filter(n => !n.read).length} new
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Read All</span>
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    markNotificationRead(n.id);
                    if (n.link) {
                      onClose();
                      setActiveTab(n.link.startsWith('/') ? n.link.slice(1) : n.link);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    n.read 
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-70' 
                      : 'bg-slate-800/80 border-slate-700 hover:border-indigo-500/50 shadow-md'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-white truncate">{n.title}</h4>
                        <span className="text-[10px] text-slate-500">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
