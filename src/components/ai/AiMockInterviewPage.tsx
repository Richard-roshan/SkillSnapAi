import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, Loader2, RefreshCw, Award, MessageSquare } from 'lucide-react';
import { SAMPLE_INTERVIEW_QUESTIONS, generateConversationalInterviewReply, saveMockInterviewToFirestore, fetchMockInterviewFromFirestore } from '../../lib/aiService';
import { FormattedMarkdown } from '../common/FormattedMarkdown';
import { useAppStore } from '../../store/useAppStore';
import { MockInterviewQuestion } from '../../types';

interface Message {
  id: string;
  sender: 'interviewer' | 'candidate';
  text: string;
  score?: number;
  timestamp: string;
}

export const AiMockInterviewPage: React.FC = () => {
  const { user } = useAppStore();
  const [questions] = useState<MockInterviewQuestion[]>(SAMPLE_INTERVIEW_QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId] = useState<string>(`session-${user?.uid || 'guest'}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize or load persisted interview conversation from Firestore
  useEffect(() => {
    async function loadHistory() {
      const saved = await fetchMockInterviewFromFirestore(sessionId);
      if (saved && saved.length > 0) {
        setMessages(saved);
        const extractedScores = saved.filter(m => m.sender === 'interviewer' && typeof m.score === 'number').map(m => m.score as number);
        setScores(extractedScores);
      } else {
        startNewSession();
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isEvaluating]);

  const startNewSession = () => {
    setCurrentIdx(0);
    setScores([]);
    setUserAnswer('');
    const firstQ = SAMPLE_INTERVIEW_QUESTIONS[0];
    const apiKey = useAppStore.getState().apiKey || import.meta.env.VITE_AI_API_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem('skillsnap_ai_api_key') : '') || '';
    const offlinePrefix = !apiKey ? `> ⚠️ **Offline Interviewer Mode** *(Set API Key in Settings for live Claude AI interviewing)*\n\n` : '';

    const initialMsgs: Message[] = [
      {
        id: 'welcome',
        sender: 'interviewer',
        text: `${offlinePrefix}Welcome to your **Live AI Technical Interview**! 👋 I'm your AI Staff Engineer & Lead Interviewer today.\n\nWe'll conduct a fluid, conversational interview tailored for the **${user?.targetRole || 'Full-Stack AI Engineer'}** role. I will evaluate your answers honestly and ask probing follow-up questions based directly on what you say.\n\n**Let's start with our first topic (${firstQ.category.toUpperCase()}):**\n> ${firstQ.question}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(initialMsgs);
    saveMockInterviewToFirestore(sessionId, initialMsgs);
  };

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || isEvaluating) return;

    const answerText = userAnswer.trim();
    setUserAnswer('');
    setIsEvaluating(true);

    const userMsg: Message = {
      id: `c-${Date.now()}`,
      sender: 'candidate',
      text: answerText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);

    try {
      const currentQ = questions[Math.min(currentIdx, questions.length - 1)];
      const historyContext = messages.map(m => ({ role: m.sender, text: m.text }));
      
      const reply = await generateConversationalInterviewReply(
        currentQ,
        answerText,
        currentIdx,
        questions.length,
        historyContext
      );

      const newScores = [...scores, reply.score];
      setScores(newScores);

      let interviewerMsgText = reply.text;
      
      // Advance topic pointer periodically or based on candidate turn count
      if ((updatedWithUser.length / 2) >= (currentIdx + 1) * 2 && currentIdx + 1 < questions.length) {
        const nextIdx = currentIdx + 1;
        const nextQ = questions[nextIdx];
        interviewerMsgText += `\n\n---\n\n📌 **Transitioning to Next Topic (${nextQ.category.toUpperCase()}):**\n> ${nextQ.question}`;
        setCurrentIdx(nextIdx);
      }

      const aiMsg: Message = {
        id: `i-${Date.now()}`,
        sender: 'interviewer',
        text: interviewerMsgText,
        score: reply.score,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedWithUser, aiMsg];
      setMessages(finalMessages);
      
      const avg = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length);
      saveMockInterviewToFirestore(sessionId, finalMessages, avg);
    } catch (err) {
      console.error('Interview turn error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive Live Interview Thread</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            AI Technical Mock Interview
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time conversational dialogue with dynamic probing follow-ups and strict scoring
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {avgScore !== null && (
            <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              avgScore >= 70 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
            }`}>
              <Award className="w-4 h-4" />
              <span>Avg Score: {avgScore}/100</span>
            </div>
          )}
          <button
            onClick={startNewSession}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[600px] overflow-hidden">
        {/* Chat Header Bar */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>AI Lead Technical Interviewer</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h4>
              <p className="text-[10px] text-slate-400">Target Role: {user?.targetRole || 'Full-Stack AI Engineer'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-[11px]">{scores.length} Turns Evaluated</span>
          </div>
        </div>

        {/* Chat Thread Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isInterviewer = msg.sender === 'interviewer';

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${!isInterviewer ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    isInterviewer
                      ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isInterviewer ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className="max-w-[88%] sm:max-w-[78%] space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                    <span className="font-bold text-slate-300">
                      {isInterviewer ? 'AI Lead Interviewer' : 'Candidate'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isInterviewer
                        ? 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none font-sans'
                        : 'bg-indigo-600 text-white rounded-tr-none font-sans shadow-md'
                    }`}
                  >
                    {isInterviewer ? (
                      <FormattedMarkdown content={msg.text} />
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isEvaluating && (
            <div className="flex items-center space-x-3 p-3 text-xs text-indigo-400">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Interviewer is reviewing your response and formulating dynamic follow-ups...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSendAnswer} className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="relative flex items-center">
            <textarea
              rows={2}
              value={userAnswer}
              disabled={isEvaluating}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendAnswer(e);
                }
              }}
              placeholder="Type your technical answer here (Press Enter to submit)..."
              className="w-full pl-4 pr-14 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
            />
            <button
              type="submit"
              disabled={!userAnswer.trim() || isEvaluating}
              className="absolute right-3 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
