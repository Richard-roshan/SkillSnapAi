import React from 'react';
import {
  Sparkles,
  Flame,
  Clock,
  BookOpen,
  ArrowRight,
  Map,
  FileCheck2,
  Video,
  Play,
  TrendingUp,
  Award
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
  onSelectCourseLesson: (courseId: string, lessonId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  setActiveTab,
  onSelectCourseLesson
}) => {
  const { user, courses, enrollments, resumeAnalysis } = useAppStore();

  // Filter enrollments so only courses present in current catalog are counted
  const validEnrollments = enrollments.filter(e => courses.some(c => c.id === e.courseId));
  const activeEnrollment = validEnrollments.find(e => e.progressPercent < 100) || validEnrollments[0];
  const activeCourse = courses.find(c => c.id === activeEnrollment?.courseId);
  const nextLessonId = activeCourse?.lessons.find(l => !activeEnrollment?.completedLessonIds.includes(l.id))?.id || activeCourse?.lessons[0]?.id;

  // Calculate real metrics
  let totalCompletedMinutes = 0;
  enrollments.forEach(en => {
    const course = courses.find(c => c.id === en.courseId);
    if (course) {
      en.completedLessonIds.forEach(lId => {
        const lesson = course.lessons.find(l => l.id === lId);
        if (lesson) {
          totalCompletedMinutes += lesson.durationMinutes;
        }
      });
    }
  });

  const realCompletedHours = Number((totalCompletedMinutes / 60).toFixed(1));
  const realStreak = user?.learningStreak ?? 0;
  const realGoalHours = user?.weeklyGoalHours ?? 0;
  const realResumeScore = resumeAnalysis?.score ?? (user?.resumeScore || 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-purple-950/60 border border-indigo-500/20 p-6 sm:p-8">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Target Role: {user?.targetRole || 'Full-Stack AI Engineer'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="ai-gradient-text">{user?.name || 'Learner'}</span>! 👋
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Track real-time progress, complete lessons, and practice AI mock interviews to reach your career goal.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setActiveTab('roadmap')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center space-x-2"
            >
              <Map className="w-4 h-4 text-indigo-400" />
              <span>View AI Roadmap</span>
            </button>
            <button
              onClick={() => setActiveTab('ai-recommendations')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Course Recs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Enrolled Courses</p>
            <h3 className="text-xl font-bold text-white">{validEnrollments.length}</h3>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Current Streak</p>
            <h3 className="text-xl font-bold text-white">{realStreak} {realStreak === 1 ? 'Day' : 'Days'}</h3>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Study Hours</p>
            <h3 className="text-xl font-bold text-white">{realCompletedHours} hrs</h3>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">ATS Resume Score</p>
            <h3 className="text-xl font-bold text-white">
              {realResumeScore > 0 ? `${realResumeScore}/100` : 'Not Analyzed'}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Row: Continue Learning Hero Card + AI Tools Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning Card */}
        {activeCourse ? (
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-indigo-400" />
                Continue Learning
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Progress: {activeEnrollment?.progressPercent || 0}%
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 mb-5">
              <img
                src={activeCourse.thumbnailUrl}
                alt={activeCourse.name}
                className="w-full sm:w-44 h-28 object-cover rounded-2xl border border-slate-800 shadow-md shrink-0"
              />
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-bold text-white line-clamp-1">{activeCourse.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{activeCourse.description}</p>
                <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-1">
                  <span>Category: <strong className="text-indigo-300">{activeCourse.category}</strong></span>
                  <span>•</span>
                  <span>Level: <strong className="text-slate-200">{activeCourse.level}</strong></span>
                </div>
              </div>
            </div>

            {/* Progress Bar & Continue Button */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${activeEnrollment?.progressPercent || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Completed {activeEnrollment?.completedLessonIds.length || 0} of {activeCourse.lessons.length} lessons
                </p>
                <button
                  onClick={() => nextLessonId && onSelectCourseLesson(activeCourse.id, nextLessonId)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <span>Resume Lesson</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-xl">
            <BookOpen className="w-10 h-10 text-slate-600 mb-1" />
            <h3 className="text-base font-bold text-white">No active course enrolled</h3>
            <p className="text-xs text-slate-400 max-w-sm">Browse our course catalog to start learning modern tech skills!</p>
            <button
              onClick={() => setActiveTab('catalog')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-all"
            >
              Explore Course Catalog
            </button>
          </div>
        )}

        {/* AI Career Readiness Quick Tools */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              AI Career Readiness Hub
            </h3>
            <p className="text-xs text-slate-400 mb-4">Identify weaknesses & verify job readiness</p>

            <div className="space-y-2.5">
              <button
                onClick={() => setActiveTab('resume-analyzer')}
                className="w-full p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-300">Resume ATS Analyzer</h4>
                    <p className="text-[10px] text-slate-400">Score & skill-gap detection</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => setActiveTab('mock-interview')}
                className="w-full p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300">AI Mock Interview</h4>
                    <p className="text-[10px] text-slate-400">Role-specific Q&A feedback</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => setActiveTab('roadmap')}
                className="w-full p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Map className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">Learning Roadmap</h4>
                    <p className="text-[10px] text-slate-400">Step-by-step skill sequence</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Recommended For Your Career Goal
          </h3>
          <button
            onClick={() => setActiveTab('catalog')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore All ({courses.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {courses.slice(0, 3).map(course => (
            <div
              key={course.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-4 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-lg group"
            >
              <div>
                <div className="relative mb-3 overflow-hidden rounded-2xl">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';
                    }}
                    className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-bold text-indigo-300">
                    {course.category}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                  {course.name}
                </h4>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{course.description}</p>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="text-indigo-300 font-semibold">{course.category}</span>
                  <span>{course.durationMinutes} mins</span>
                </div>
                <button
                  onClick={() => onSelectCourseLesson(course.id, course.lessons[0].id)}
                  className="w-full py-2 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  View Course Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
