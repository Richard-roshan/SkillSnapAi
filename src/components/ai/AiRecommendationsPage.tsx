import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Loader2, Star } from 'lucide-react';
import { generateCourseRecommendations } from '../../lib/aiService';
import { logUserActivity } from '../../lib/firebaseService';
import { useAppStore } from '../../store/useAppStore';
import { CourseRecommendationResult } from '../../types';

interface AiRecommendationsPageProps {
  onSelectCourseLesson: (courseId: string, lessonId: string) => void;
}

export const AiRecommendationsPage: React.FC<AiRecommendationsPageProps> = ({
  onSelectCourseLesson
}) => {
  const { user, courses, enrollments, enrollInCourse } = useAppStore();

  const [careerGoal, setCareerGoal] = useState(user?.careerGoal || 'Senior Full-Stack AI Engineer');
  const [resumeText, setResumeText] = useState('');
  const [interests, setInterests] = useState<string[]>(['React 18', 'TypeScript', 'LLMs', 'RAG Architecture']);
  const [interestInput, setInterestInput] = useState('');

  const [recommendations, setRecommendations] = useState<CourseRecommendationResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (item: string) => {
    setInterests(interests.filter(i => i !== item));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      logUserActivity(user?.uid || 'guest', 'course_recommendation');
      const completedIds = enrollments.map(e => e.courseId);
      const results = await generateCourseRecommendations(careerGoal, resumeText, completedIds, interests);
      setRecommendations(results);
    } catch (err: any) {
      console.error('Recommendation generation failed:', err);
      setErrorMessage(err?.message || 'Failed to generate tailored course recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI-Powered Personalization Engine</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          AI Course Recommendations
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Input your target career goal and resume text to receive ranked, tailored course suggestions
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Career Goal</label>
            <input
              type="text"
              required
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              placeholder="e.g. Senior Full-Stack AI Architect"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Resume Text or Skill Summary (Optional)
            </label>
            <textarea
              rows={3}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste relevant experience or skills..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Key Technical Interests</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                placeholder="e.g. Vector DBs"
                className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {interests.map(item => (
                <span
                  key={item}
                  className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium flex items-center gap-1.5"
                >
                  {item}
                  <button type="button" onClick={() => handleRemoveInterest(item)} className="hover:text-white">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running AI Personalization Algorithm...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Tailored Course Recommendations</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>❌ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white text-sm font-bold">✕</button>
        </div>
      )}

      {/* Recommendations Results List */}
      {recommendations && (
        <div className="space-y-4 pt-2">
          {recommendations[0]?.isOfflineEstimate && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-sans">
              <span>⚠️ <strong>Offline Estimate Mode:</strong> Configure an Anthropic API key in Settings for full Claude AI personalization.</span>
            </div>
          )}

          {/* Catalog Completion Banner */}
          {enrollments.length >= courses.length && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-3 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-white text-sm block">🎉 You've completed all available courses in our catalog — great work!</strong>
                Below are your personalized recommendations ranked for continuous skill refresh & advanced practice.
              </div>
            </div>
          )}

          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Ranked Recommendations ({recommendations.length})
          </h3>

          <div className="space-y-4">
            {recommendations.map((rec, rankIndex) => {
              const course = courses.find(c => c.id === rec.courseId);
              if (!course) return null;
              const isEnrolled = enrollments.some(e => e.courseId === course.id);

              return (
                <div
                  key={rec.courseId}
                  className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 text-sm shrink-0">
                      #{rankIndex + 1}
                    </div>

                    <img
                      src={course.thumbnailUrl}
                      alt={course.name}
                      className="w-24 h-20 object-cover rounded-2xl border border-slate-800 shrink-0 hidden sm:block"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                          {rec.matchScore}% Match
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">• {course.category}</span>
                      </div>
                      <h4 className="text-base font-bold text-white">{course.name}</h4>
                      <p className="text-xs text-slate-300 font-medium">💡 AI Reason: {rec.reason}</p>
                    </div>
                  </div>

                  <div className="shrink-0 w-full md:w-auto">
                    {isEnrolled ? (
                      <button
                        onClick={() => onSelectCourseLesson(course.id, course.lessons[0].id)}
                        className="w-full md:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Enrolled • Continue</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          enrollInCourse(course.id);
                          onSelectCourseLesson(course.id, course.lessons[0].id);
                        }}
                        className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>Enroll Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
