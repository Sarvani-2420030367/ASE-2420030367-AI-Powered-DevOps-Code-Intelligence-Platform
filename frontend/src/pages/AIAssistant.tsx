import React, { useState, useEffect, useRef } from 'react';
import { Project, ChatMessage } from '../types';
import { api } from '../services/api';
import { Sparkles, Send, Bot, User, FileCode, ArrowRight, Loader2 } from 'lucide-react';

interface AIAssistantProps {
  project: Project | null;
  initialQuery?: string;
  onOpenFile?: (file: string, line?: number) => void;
}

const QUICK_PROMPTS = [
  'Explain this project',
  'How does authentication work?',
  'Where is the database connection?',
  'Find possible security problems',
  'Explain the architecture',
  'How can I improve this code?',
  'Generate tests for this function',
  'How do I deploy this project?',
];

export const AIAssistant: React.FC<AIAssistantProps> = ({
  project,
  initialQuery,
  onOpenFile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (project?.id) {
      loadChatHistory();
    }
  }, [project?.id]);

  useEffect(() => {
    if (initialQuery) {
      setInput(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadChatHistory = async () => {
    try {
      const resp = await api.get(`/api/ai/projects/${project!.id}/messages`);
      if (resp.data.length > 0) {
        setMessages(resp.data);
      } else {
        // Add welcome message
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            message: `Hello! I am your **DevSight AI Assistant**, specialized in codebase architecture, security auditing, and cloud DevOps delivery for **${project?.name}**.\n\nAsk me anything about your files, authentication flow, database layer, or deployment manifests!`,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const handleSend = async (messageToSend?: string) => {
    const text = messageToSend || input;
    if (!text.trim() || !project) return;

    const tempUserMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await api.post('/api/ai/chat', {
        project_id: project.id,
        message: text,
      });

      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        message: resp.data.response,
        sources: resp.data.sources || [],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          message: 'Error communicating with AI assistant. Please try again.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-sky-500 flex items-center justify-center shadow-md shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">DevSight AI Assistant</h2>
            <p className="text-[11px] text-slate-400">Context-aware repository intelligence & DevOps agent</p>
          </div>
        </div>

        <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
          {project?.name || 'Codebase Active'}
        </span>
      </div>

      {/* Suggested Quick Chips */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto flex items-center gap-2 scrollbar-none">
        <span className="text-[10px] text-slate-400 uppercase font-semibold shrink-0">Suggestions:</span>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 shrink-0 transition-all font-medium"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isAssistant = m.role === 'assistant';
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-3xl ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isAssistant
                    ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-sm shadow-sky-500/20'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`rounded-2xl p-4 text-xs leading-relaxed ${
                  isAssistant
                    ? 'bg-slate-950/90 text-slate-200 border border-slate-800/80 shadow-md'
                    : 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                }`}
              >
                <div className="prose prose-invert prose-xs max-w-none space-y-2 whitespace-pre-wrap font-sans">
                  {m.message}
                </div>

                {/* Sources References in Assistant Message */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Referenced Code Sources:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {m.sources.map((src, i) => (
                        <button
                          key={i}
                          onClick={() => onOpenFile?.(src.file_path, src.line_number)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-700/80 text-sky-400 hover:underline font-mono text-[11px]"
                        >
                          <FileCode className="w-3 h-3" />
                          {src.file_path}
                          {src.line_number ? `:${src.line_number}` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              Thinking with repository AST context...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about architecture, security, deploy scripts, or write tests..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-sky-500/20 disabled:opacity-40 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
