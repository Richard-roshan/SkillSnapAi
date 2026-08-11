import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  BookOpen,
  FileText,
  HelpCircle,
  Download,
  Sparkles,
  ArrowLeft,
  Award,
  ExternalLink
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { AiStudyAssistantDrawer } from './AiStudyAssistantDrawer';

interface LessonPlayerPageProps {
  courseId: string;
  lessonId: string;
  onNavigateBack: () => void;
  onSelectLesson: (lessonId: string) => void;
}

export const LessonPlayerPage: React.FC<LessonPlayerPageProps> = ({
  courseId,
  lessonId,
  onNavigateBack,
  onSelectLesson
}) => {
  const { courses, enrollments, markLessonComplete, issueCertificate } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'quiz'>('overview');
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const course = courses.find(c => c.id === courseId);
  const lesson = course?.lessons.find(l => l.id === lessonId) || course?.lessons[0];
  const enrollment = enrollments.find(e => e.courseId === courseId);

  if (!course || !lesson) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Course or lesson not found.</p>
        <button onClick={onNavigateBack} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs rounded-xl">
          Return to My Courses
        </button>
      </div>
    );
  }

  const isLessonCompleted = enrollment?.completedLessonIds?.includes(lesson.id) || false;
  const isCourseCompleted = (enrollment?.progressPercent || 0) >= 100;

  const handleAnswerSelect = (qId: string, optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    markLessonComplete(courseId, lesson.id);
  };

  const handleMarkComplete = () => {
    console.log(`✅ [LessonPlayer] User clicked Mark Complete for course "${courseId}", lesson "${lesson.id}"`);
    markLessonComplete(courseId, lesson.id);
  };

  const rawYoutubeUrl = lesson.videoUrl.replace('/embed/', '/watch?v=');

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <button
          onClick={onNavigateBack}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Courses</span>
        </button>

        <div className="flex items-center space-x-3">
          {isLessonCompleted ? (
            <button
              onClick={handleMarkComplete}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-all cursor-pointer"
              title="Click to toggle or update completion state"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Lesson Completed</span>
            </button>
          ) : (
            <button
              onClick={handleMarkComplete}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Complete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Video Player + Playlist Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Box */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
            {!videoError && (lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be')) ? (
              <iframe
                src={`${lesson.videoUrl}?autoplay=0&rel=0&enablejsapi=1`}
                title={lesson.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => setVideoError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-1">
                  <Play className="w-7 h-7 text-indigo-400" />
                </div>
                <h4 className="font-bold text-white text-base">{lesson.title}</h4>
                <p className="text-xs text-slate-400 max-w-sm">If inline playback is blocked by your network or browser settings, watch directly on YouTube or continue with lesson materials below.</p>
                <div className="flex items-center space-x-3 pt-2">
                  <a
                    href={rawYoutubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
                  >
                    <span>Watch on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleMarkComplete}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-all flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Complete</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-1">{lesson.title}</h2>
            <p className="text-xs text-slate-400">Course: <strong className="text-indigo-300">{course.name}</strong></p>
          </div>
        </div>

        {/* Lesson Navigator Sidebar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Course Playlist ({course.lessons.length})
              </h3>
              <span className="text-xs font-bold text-indigo-400">{enrollment?.progressPercent || 0}%</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {course.lessons.map((l, index) => {
                const isCurrent = l.id === lesson.id;
                const isDone = enrollment?.completedLessonIds?.includes(l.id);

                return (
                  <button
                    key={l.id}
                    onClick={() => { setVideoError(false); onSelectLesson(l.id); }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md'
                        : isDone
                        ? 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-900/30 border-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                          {index + 1}
                        </div>
                      )}
                      <span className="text-xs font-semibold truncate">{l.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 pl-2">{l.durationMinutes}m</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Certificate Banner if 100% */}
          {isCourseCompleted && (
            <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300">
                <Award className="w-4 h-4 text-emerald-400" />
                Course Graduation Completed!
              </div>
              <button
                onClick={() => issueCertificate(course.id)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                View Certificate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section Below Player */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        {/* Tab Selector */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Overview & Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'notes'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Study Notes & Resources</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quiz Verification ({lesson.quiz.length})</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <h4 className="text-sm font-bold text-white">Lesson Summary</h4>
            <p>{lesson.summary}</p>

            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200">
              <h5 className="font-bold mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Key Skills Mastered in this Lesson:
              </h5>
              <div className="flex flex-wrap gap-2 pt-1">
                {course.skillsCovered.map(skill => (
                  <span key={skill} className="px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-sm font-bold text-white">Downloadable Notes & Code Samples</h4>
              <button
                onClick={() => alert(`Downloading study guide PDF for ${lesson.title}`)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Notes</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto">
              {lesson.notes}
            </div>
          </div>
        )}

        {/* Tab 3: Quiz */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            {lesson.quiz[0]?.isOfflineEstimate && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-sans">
                ⚡ <strong>Offline Quiz Mode:</strong> Set an Anthropic API Key in Settings for live Claude AI question generation.
              </div>
            )}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-white">Lesson Knowledge Quiz</h4>
                <p className="text-xs text-slate-400">Answer all questions to verify topic mastery</p>
              </div>
              {quizSubmitted && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                  Quiz Submitted!
                </span>
              )}
            </div>

            <div className="space-y-6">
              {lesson.quiz.map((q, qIndex) => {
                const selectedIdx = selectedAnswers[q.id];
                const isCorrect = selectedIdx === q.correctIndex;

                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <p className="text-xs font-bold text-white">
                      {qIndex + 1}. {q.question}
                    </p>

                    <div className="space-y-2">
                      {q.options.map((opt, optIndex) => {
                        let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

                        if (selectedIdx === optIndex) {
                          btnStyle = 'bg-indigo-600/30 border-indigo-500 text-white font-bold';
                        }

                        if (quizSubmitted) {
                          if (optIndex === q.correctIndex) {
                            btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                          } else if (selectedIdx === optIndex && !isCorrect) {
                            btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                          }
                        }

                        return (
                          <button
                            key={optIndex}
                            onClick={() => handleAnswerSelect(q.id, optIndex)}
                            className={`w-full p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="p-3 rounded-xl bg-slate-900 text-xs text-slate-300 space-y-1">
                        <p className="font-bold text-indigo-400">Explanation:</p>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!quizSubmitted && (
              <button
                onClick={handleQuizSubmit}
                disabled={Object.keys(selectedAnswers).length < lesson.quiz.length}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Submit Answers & Update Progress
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI Assistant Drawer */}
      <AiStudyAssistantDrawer
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
        lesson={lesson}
      />
    </div>
  );
};
