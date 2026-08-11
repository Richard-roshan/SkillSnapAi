import React, { useState, useEffect } from 'react';
import { Map, Sparkles, CheckCircle2, Circle, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { generateLearningRoadmap } from '../../lib/aiService';
import { useAppStore } from '../../store/useAppStore';
import { LearningRoadmap, RoadmapStep } from '../../types';

interface AiRoadmapPageProps {
  onSelectCourseLesson: (courseId: string, lessonId: string) => void;
}

export const AiRoadmapPage: React.FC<AiRoadmapPageProps> = ({ onSelectCourseLesson }) => {
  const { user, roadmap, saveRoadmap, courses, enrollInCourse } = useAppStore();
  const [currentRoadmap, setCurrentRoadmap] = useState<LearningRoadmap | null>(roadmap);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState<RoadmapStep | null>(null);

  const [snapshotCount, setSnapshotCount] = useState(0);
  const [lastSnapshotTime, setLastSnapshotTime] = useState<string>('Connecting...');

  useEffect(() => {
    if (roadmap) {
      console.log('🗺️ [AiRoadmapPage Sync] Received updated store roadmap:', roadmap.steps.map(s => `${s.id}:${s.status}`).join(', '));
      setSnapshotCount(prev => prev + 1);
      setLastSnapshotTime(new Date().toLocaleTimeString());
      setCurrentRoadmap(roadmap);
      if (!selectedStep && roadmap.steps.length > 0) {
        setSelectedStep(roadmap.steps[0]);
      }
    } else if (!isLoading && !currentRoadmap) {
      const timer = setTimeout(() => {
        if (!useAppStore.getState().roadmap) {
          console.log('🗺️ [AiRoadmapPage Initial Seed] No existing roadmap found in cloud, generating initial career pathway...');
          handleGenerate();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [roadmap]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const generated = await generateLearningRoadmap(
        user?.careerGoal || 'Senior Full-Stack AI Engineer',
        user?.skills || []
      );
      console.log('🗺️ [AiRoadmapPage Generated] New roadmap created:', generated.steps.map(s => `${s.id}:${s.status}`).join(', '));
      setCurrentRoadmap(generated);
      saveRoadmap(generated);
      if (generated.steps.length > 0) {
        setSelectedStep(generated.steps[0]);
      }
    } catch (e) {
      console.error('Roadmap generation error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStepStatus = (stepId: string) => {
    if (!currentRoadmap) return;
    const updatedSteps = currentRoadmap.steps.map(s => {
      if (s.id === stepId) {
        const nextStatus = s.status === 'completed' ? 'in_progress' : 'completed';
        return { ...s, status: nextStatus as RoadmapStep['status'] };
      }
      return s;
    });

    const updated = { ...currentRoadmap, steps: updatedSteps };
    console.log(`🗺️ [AiRoadmapPage Step Toggle] Step "${stepId}" toggled. New state:`, updatedSteps.map(s => `${s.id}:${s.status}`).join(', '));
    setCurrentRoadmap(updated);
    saveRoadmap(updated);
    if (selectedStep?.id === stepId) {
      setSelectedStep(updatedSteps.find(s => s.id === stepId) || null);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Personalized Career Pathways</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            AI Learning Roadmap
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Target Goal: <span className="text-cyan-300 font-bold">{currentRoadmap?.targetRole || user?.careerGoal || 'Full-Stack AI Engineer'}</span>
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Regenerate Roadmap</span>
        </button>
      </div>

      {/* Live Firestore Debug Sync Indicator Banner */}
      <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200 space-y-2 shadow-xl font-sans">
        {currentRoadmap?.isOfflineEstimate && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] mb-2">
            ⚠️ <strong>Offline Roadmap Mode:</strong> Set an Anthropic API key in Settings for custom Claude AI sequence generation.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-2 font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-emerald-300">FIRESTORE SNAPSHOT LISTENER: ACTIVE</span>
          </div>
          <span className="text-[11px] text-cyan-400">Snapshots Received: <strong>#{snapshotCount}</strong> | Last Fired: {lastSnapshotTime}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
          <div>
            <span className="text-slate-400">UID:</span> <strong className="text-cyan-300">{user?.uid || 'guest'}</strong>
          </div>
          <div>
            <span className="text-slate-400">Firestore Path:</span> <strong className="text-cyan-300">users/{user?.uid || 'guest'}/roadmap/active</strong>
          </div>
        </div>

        <div className="pt-1">
          <span className="text-slate-400 font-mono text-[11px] block mb-1">Live Cloud Step Completion States:</span>
          <div className="flex flex-wrap gap-2">
            {currentRoadmap?.steps.map((s, idx) => (
              <span
                key={s.id}
                className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] ${
                  s.status === 'completed'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Step {idx + 1}: [{s.status}]
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Sequence Chain */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sequence Steps Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            Click any step to inspect skills, course links, and estimated completion timeline.
          </div>

          <div className="relative space-y-4 before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
            {currentRoadmap?.steps.map((step, index) => {
              const isSelected = selectedStep?.id === step.id;
              const isDone = step.status === 'completed';

              return (
                <div
                  key={step.id}
                  onClick={() => setSelectedStep(step)}
                  className={`relative flex items-start space-x-4 p-4 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStepStatus(step.id);
                    }}
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 z-10 font-bold text-xs transition-transform hover:scale-110 select-none ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-800 border border-slate-700 text-cyan-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-white truncate">{step.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                        {step.estimatedWeeks} wks
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-2.5">{step.description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {step.skills.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-cyan-300 text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Step Inspection Card */}
        <div>
          {selectedStep ? (
            <div className="sticky top-20 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Step Details</span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedStep.title}</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedStep.description}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Estimated Timeline: {selectedStep.estimatedWeeks} Weeks
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedStep.skills.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Course Link Action */}
              <div className="pt-2">
                {(() => {
                  const course = selectedStep.recommendedCourseId ? courses.find(c => c.id === selectedStep.recommendedCourseId) : null;
                  if (!course) {
                    return (
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                          Module Coming Soon
                        </span>
                        <p className="text-[11px] text-slate-400">Specialized advanced module for this roadmap milestone.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
                        <img src={course.thumbnailUrl} alt={course.name} className="w-12 h-12 object-cover rounded-xl shrink-0" />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-white truncate">{course.name}</h5>
                          <p className="text-[10px] text-indigo-300">{course.category}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          enrollInCourse(course.id);
                          onSelectCourseLesson(course.id, course.lessons[0].id);
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>Start Step Course</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl">
              Select a roadmap step to view detailed skill breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
