import React, { useState } from 'react';
import { FileCheck2, Sparkles, AlertCircle, CheckCircle2, Loader2, ArrowRight, Upload } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { analyzeResume } from '../../lib/aiService';
import { useAppStore } from '../../store/useAppStore';
import { ResumeAnalysis } from '../../types';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface AiResumeAnalyzerPageProps {
  onSelectCourseLesson: (courseId: string, lessonId: string) => void;
}

export const AiResumeAnalyzerPage: React.FC<AiResumeAnalyzerPageProps> = ({
  onSelectCourseLesson
}) => {
  const { user, resumeAnalysis, saveResumeAnalysis, courses, enrollInCourse, updateUserProfile } = useAppStore();

  const [resumeText, setResumeText] = useState(
    `Alex Mercer | Full-Stack Software Engineer\n- 3+ years experience building React, TypeScript, and Node.js web applications.\n- Designed REST APIs with Express and PostgreSQL.\n- Eager to learn Generative AI, RAG pipelines, and LLM APIs.`
  );
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Full-Stack AI Engineer');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(resumeAnalysis);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ filename: string; charCount: number } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      let extractedText = '';
      const isTxt = file.name.toLowerCase().endsWith('.txt');

      if (isTxt) {
        extractedText = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve((ev.target?.result as string) || '');
          reader.readAsText(file);
        });
      } else {
        // Genuine PDF Text Extraction via pdfjs-dist
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullText = '';

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n\n';
          }
          extractedText = fullText;
        } catch (pdfErr) {
          console.warn('PDF.js parsing failed, attempting text reader fallback:', pdfErr);
        }
      }

      const trimmed = extractedText.trim();
      if (trimmed && trimmed.length > 10) {
        setResumeText(trimmed);
        setUploadStatus({ filename: file.name, charCount: trimmed.length });
      } else {
        alert('Could not extract text content from the selected PDF. Please select a text-based PDF or .txt file.');
      }
    } catch (err) {
      console.error('File parsing error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) return;

    setIsLoading(true);
    try {
      const result = await analyzeResume(resumeText, targetRole);
      setAnalysis(result);
      saveResumeAnalysis(result);
      updateUserProfile({ resumeScore: result.score, targetRole });
    } catch (err) {
      console.error('Resume analysis failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.txt,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>ATS Optimization & Gap Detection</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          AI Resume Analyzer
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Upload a resume file or paste text to compute an ATS score, identify missing skill gaps, and match with relevant courses
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-5">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Job Role</label>
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Full-Stack AI Engineer"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Resume Text Content</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-[11px] text-indigo-300 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Upload File / PDF</span>
                </button>
              </div>

              {uploadStatus && (
                <div className="mb-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center justify-between">
                  <span>📄 Loaded: <strong>{uploadStatus.filename}</strong></span>
                  <span className="font-mono text-[10px]">{uploadStatus.charCount} chars</span>
                </div>
              )}

              <textarea
                rows={10}
                required
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste work experience, technical skills, education..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Resume ATS Keywords...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Run AI Resume Score & Skill-Gap Analysis</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div>
          {analysis ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              {analysis.isOfflineEstimate && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-sans">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Offline Estimate Mode:</strong> Configure an API key in Settings for full Claude AI analysis.</span>
                </div>
              )}

              {/* ATS Gauge Score */}
              <div className="flex items-center space-x-6 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <div className="w-full h-full rounded-full border-4 border-slate-800 border-t-indigo-500 border-r-purple-500 animate-spin-slow" />
                  <span className="absolute text-xl font-black text-white">{analysis.score}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">ATS Readiness Score</h3>
                  <p className="text-xs text-indigo-300 font-medium mb-1">Target: {analysis.targetRole}</p>
                  <p className="text-[11px] text-slate-400">
                    {analysis.score >= 80 ? '🔥 High Match for Target Role' : '⚡ Action Required: Bridge detected skill gaps'}
                  </p>
                </div>
              </div>

              {/* Strengths */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Key Resume Strengths ({analysis.strengths.length})
                </h4>
                <div className="space-y-1.5">
                  {analysis.strengths.map((str, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                      ✓ {str}
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Gaps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  Identified Missing Skill Gaps ({analysis.skillGaps.length})
                </h4>
                <div className="space-y-1.5">
                  {analysis.skillGaps.map((gap, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
                      ⚠ {gap}
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Recommendations to Bridge Gaps */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Recommended Courses to Bridge Gaps
                </h4>
                <div className="space-y-2">
                  {analysis.recommendedCourseIds.map(cId => {
                    const course = courses.find(c => c.id === cId);
                    if (!course) return null;

                    return (
                      <div
                        key={course.id}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <img src={course.thumbnailUrl} alt={course.name} className="w-10 h-10 object-cover rounded-xl shrink-0" />
                          <div>
                            <h5 className="text-xs font-bold text-white line-clamp-1">{course.name}</h5>
                            <p className="text-[10px] text-slate-400">{course.category}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            enrollInCourse(course.id);
                            onSelectCourseLesson(course.id, course.lessons[0].id);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Enroll Now
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl">
              <FileCheck2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-xs">Run analysis to see your ATS Score and Skill Gaps</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
