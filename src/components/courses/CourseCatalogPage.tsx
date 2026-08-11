import React, { useState } from 'react';
import { Compass, Search, Star, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface CourseCatalogPageProps {
  onSelectCourseLesson: (courseId: string, lessonId: string) => void;
}

export const CourseCatalogPage: React.FC<CourseCatalogPageProps> = ({ onSelectCourseLesson }) => {
  const { courses, enrollments, enrollInCourse } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Full-Stack Web',
    'AI & Data Science',
    'Cloud & DevOps',
    'Mobile & Cross-Platform',
    'UI/UX & Product Design'
  ];

  const normalize = (str: string) =>
    str.toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9&]/g, ' ').replace(/\s+/g, ' ').trim();

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'All' || 
      normalize(course.category) === normalize(selectedCategory);
      
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.skillsCovered.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  console.log(`📊 [CourseCatalog] Category Filter: "${selectedCategory}" | Total Courses: ${courses.length} | Matched: ${filteredCourses.length}`);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-400" />
            Explore Course Catalog ({courses.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Master industry-aligned tech stacks with embedded quizzes and AI study assistance
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search python, react, figma, spark..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => {
          const count = cat === 'All'
            ? courses.length
            : courses.filter(c => normalize(c.category) === normalize(cat)).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty State Handler */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
          <Compass className="w-10 h-10 text-slate-600 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-white">No courses match "{selectedCategory}"</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try clearing your search keyword or switching category tabs to explore all {courses.length} courses.
          </p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Reset Filters (Show All {courses.length} Courses)
          </button>
        </div>
      )}

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => {
          const isEnrolled = enrollments.some(e => e.courseId === course.id);
          const firstLessonId = course.lessons[0]?.id || '';

          return (
            <div
              key={course.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-xl group"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative mb-4 overflow-hidden rounded-2xl">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';
                    }}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-bold text-indigo-300">
                    {course.category}
                  </span>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-semibold text-slate-300">
                    {course.level}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1.5 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                  {course.name}
                </h3>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{course.description}</p>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {course.skillsCovered.slice(0, 3).map(skill => (
                    <span
                      key={skill}
                      className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-medium text-indigo-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-slate-400 pb-3 mb-3 border-b border-slate-800">
                  <span className="text-indigo-300 font-semibold">{course.category}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {course.durationMinutes} mins
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {isEnrolled ? (
                <button
                  onClick={() => onSelectCourseLesson(course.id, firstLessonId)}
                  className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>Enrolled • Start Learning</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    enrollInCourse(course.id);
                    onSelectCourseLesson(course.id, firstLessonId);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Enroll in Course</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
