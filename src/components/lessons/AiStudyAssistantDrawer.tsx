import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Bot, User, X, Loader2, AlertCircle } from 'lucide-react';
import { askStudyAssistant, saveAiChatToFirestore, fetchAiChatFromFirestore } from '../../lib/aiService';
import { FormattedMarkdown } from '../common/FormattedMarkdown';
import { Lesson } from '../../types';

interface AiStudyAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AiStudyAssistantDrawer: React.FC<AiStudyAssistantDrawerProps> = ({
  isOpen,
  onClose,
  lesson
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load chat history from Firestore on drawer open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadCachedChat = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      const cached = await fetchAiChatFromFirestore(lesson.id);
      if (isMounted) {
        if (cached && cached.length > 0) {
          setMessages(cached);
        } else {
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `Hello! I am your **SkillSnap AI Study Assistant**. Ask me any question about **${lesson.title}** or request a practical code example!`
            }
          ]);
        }
        setIsLoading(false);
      }
    };

    loadCachedChat();
    return () => { isMounted = false; };
  }, [isOpen, lesson.id]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue('');
    setErrorMsg(null);

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: userText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const responseText = await askStudyAssistant(
        lesson.title,
        lesson.summary,
        userText,
        updatedMessages.map(m => ({ role: m.role, content: m.content }))
      );

      const aiMsg: ChatMessage = { id: `a-${Date.now()}`, role: 'assistant', content: responseText };
      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);

      // Cache updated chat in Cloud Firestore
      await saveAiChatToFirestore(lesson.id, finalMessages);
    } catch (err: any) {
      console.error('Study assistant error:', err);
      setErrorMsg(err?.message || 'Failed to generate response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              AI Study Assistant
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </h3>
            <p className="text-[10px] text-slate-400 truncate max-w-[220px]">Context: {lesson.title}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2.5 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-purple-950/80 border border-purple-500/30 text-purple-300'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-purple-400" />}
            </div>

            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none font-sans'
              }`}
            >
              {msg.role === 'assistant' ? (
                <FormattedMarkdown content={msg.content} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2.5 text-xs text-indigo-400 p-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>AI Assistant is generating explanation...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about this lesson..."
            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
