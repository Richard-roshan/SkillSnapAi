import React, { useState } from 'react';
import { BookOpen, Play, CheckCircle2, Award, Clock, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface MyCoursesPageProps {
  onSelectCourseLesson: (courseId: string, lessonId: string) => void;
  setActiveTab: (tab: string) => void;
}

export const MyCoursesPage: React.FC<MyCoursesPageProps> = ({
  onSelectCourseLesson,
  setActiveTab
}) => {
  const { courses, enrollments } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Wire to real enrollment data
  const enrolledItems = enrollments.map(en => {
    const course = courses.find(c => c.id === en.courseId);
    return {
      enrollment: en,
      course
    };
  }).filter(item => Boolean(item.course));

  const filteredItems = enrolledItems.filter(item => {
    if (filter === 'in_progress') return item.enrollment.progressPercent < 100;
    if (filter === 'completed') return item.enrollment.progressPercent >= 100;
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            My Enrolled Courses
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time enrollment tracking synced with Firestore database
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({enrolledItems.length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'in_progress'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            In Progress ({enrolledItems.filter(i => i.enrollment.progressPercent < 100).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'completed'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({enrolledItems.filter(i => i.enrollment.progressPercent >= 100).length})
          </button>
        </div>
      </div>

      {/* Courses List Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No courses match this filter</h3>
          <p className="text-xs text-slate-400 mb-4">Explore our catalog to start learning new skills!</p>
          <button
            onClick={() => setActiveTab('catalog')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Explore Course Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(({ enrollment, course }) => {
            if (!course) return null;
            const completedCount = enrollment.completedLessonIds.length;
            const totalLessons = course.lessons.length;
            const isCompleted = enrollment.progressPercent >= 100;
            const nextLessonId = course.lessons.find(l => !enrollment.completedLessonIds.includes(l.id))?.id || course.lessons[0].id;

            return (
              <div
                key={enrollment.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-xl relative group"
              >
                <div>
                  {/* Thumbnail & Badge */}
                  <div className="relative mb-4 overflow-hidden rounded-2xl">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.name}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-bold text-indigo-300">
                      {course.category}
                    </span>
                    {isCompleted && (
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    )}
                  </div>

                  {/* Title & Instructor */}
                  <h3 className="text-base font-bold text-white mb-1.5 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                    {course.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{course.description}</p>
                  
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mb-4">
                    <span>Level: <strong className="text-slate-200">{course.level}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {course.durationMinutes}m
                    </span>
                  </div>
                </div>

                {/* Progress Section & Continue Action */}
                <div className="space-y-3.5 pt-3 border-t border-slate-800/80">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-300">Overall Progress</span>
                      <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-indigo-400 font-bold'}>
                        {enrollment.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                        style={{ width: `${enrollment.progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {completedCount} of {totalLessons} lessons marked complete
                    </p>
                  </div>

                  {isCompleted ? (
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>View & Download Certificate</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectCourseLesson(course.id, nextLessonId)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Continue Learning</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
