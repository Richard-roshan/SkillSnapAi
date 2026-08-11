import React, { useState } from 'react';
import { User, Award, Flame, BookOpen, Sparkles, Download, CheckCircle2, ShieldCheck, Edit3, Check, X, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { CertificateModal } from './CertificateModal';
import { Course } from '../../types';

export const ProfilePage: React.FC = () => {
  const { user, enrollments, courses, updateUserProfile, resetAccountProgress } = useAppStore();
  const [selectedCertCourse, setSelectedCertCourse] = useState<Course | null>(null);

  // Target role inline editing
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [roleInput, setRoleInput] = useState(user?.targetRole || 'Full-Stack AI Engineer');
  const [isResetting, setIsResetting] = useState(false);

  const handleSaveRole = () => {
    if (roleInput.trim()) {
      updateUserProfile({ targetRole: roleInput.trim() });
    }
    setIsEditingRole(false);
  };

  const handleResetProgress = async () => {
    if (confirm('Are you sure you want to reset all account progress (enrollments, roadmap progress, hours, certificates) back to fresh initial state?')) {
      setIsResetting(true);
      try {
        await resetAccountProgress();
      } finally {
        setIsResetting(false);
      }
    }
  };

  const issuedEnrollments = enrollments.filter(e => e.certificateStatus === 'issued' || e.progressPercent >= 100);
  const realStreak = user?.learningStreak ?? 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-400" />
          Profile & Verified Credentials
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage career settings, skills inventory, and view earned course certificates
        </p>
      </div>

      {/* User Info Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
            alt={user?.name}
            className="w-20 h-20 rounded-3xl object-cover ring-4 ring-indigo-500/30 shadow-xl"
          />
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <h3 className="text-xl font-bold text-white">{user?.name || 'Learner'}</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                PRO Learner
              </span>
            </div>
            <p className="text-xs text-slate-400">{user?.email}</p>

            {/* Editable Target Role */}
            <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs pt-1">
              <span className="text-indigo-300 font-semibold">Target Role:</span>
              {isEditingRole ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    placeholder="Enter target role..."
                    className="px-2 py-0.5 bg-slate-950 border border-indigo-500/50 rounded-lg text-xs text-white focus:outline-none"
                  />
                  <button onClick={handleSaveRole} className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setIsEditingRole(false)} className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <strong className="text-white">{user?.targetRole || 'Not Set (Click Edit)'}</strong>
                  <button
                    onClick={() => { setRoleInput(user?.targetRole || ''); setIsEditingRole(true); }}
                    className="p-1 text-slate-400 hover:text-indigo-300 cursor-pointer"
                    title="Edit Target Role"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 shrink-0">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
            <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-white">{realStreak} {realStreak === 1 ? 'Day' : 'Days'}</p>
            <p className="text-[10px] text-amber-400">Streak</p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <Award className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-white">{issuedEnrollments.length}</p>
            <p className="text-[10px] text-emerald-400">Certificates</p>
          </div>

          <button
            onClick={handleResetProgress}
            disabled={isResetting}
            className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-center transition-all cursor-pointer group disabled:opacity-50"
            title="Reset account progress to fresh initial state"
          >
            <RotateCcw className={`w-5 h-5 text-rose-400 mx-auto mb-1 ${isResetting ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <p className="text-xs font-bold text-white">{isResetting ? 'Resetting...' : 'Reset'}</p>
            <p className="text-[10px] text-rose-400">Progress</p>
          </button>
        </div>
      </div>

      {/* Skills Inventory Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Mastered Skills Inventory
        </h3>
        <div className="flex flex-wrap gap-2">
          {user?.skills && user.skills.length > 0 ? (
            user.skills.map(skill => (
              <span
                key={skill}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                {skill}
              </span>
            ))
          ) : (
            <p className="text-xs text-slate-400">No skills added yet.</p>
          )}
        </div>
      </div>

      {/* Verified Certificates Showcase */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Earned Verified Certificates ({issuedEnrollments.length})
        </h3>

        {issuedEnrollments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl">
            <Award className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-xs">Complete 100% of any course to unlock your official verified certificate.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {issuedEnrollments.map(en => {
              const course = courses.find(c => c.id === en.courseId);
              if (!course) return null;

              return (
                <div
                  key={en.id}
                  className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Completion
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5 line-clamp-1">{course.name}</h4>
                      <p className="text-xs text-slate-400">{course.category} • SkillSnap Certified</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCertCourse(course)}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>View & Download Certificate</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {selectedCertCourse && (
        <CertificateModal
          isOpen={Boolean(selectedCertCourse)}
          onClose={() => setSelectedCertCourse(null)}
          course={selectedCertCourse}
          userName={user?.name || 'Learner'}
        />
      )}
    </div>
  );
};
