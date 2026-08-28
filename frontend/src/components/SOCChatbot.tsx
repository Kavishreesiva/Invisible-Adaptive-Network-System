import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Shield, Minimize2, Terminal, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  quickPrompts?: string[];
}

export const SOCChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: "👋 **Hello! I am IANSA AI SOC Assistant.**\n\nI am actively monitoring your network status, threat events, and Moving Target Defense (MTD) rotations. How can I assist your security operations today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickPrompts: ["Check my IP", "How is security status?", "Show blocked IPs", "Explain MTD"]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await api.queryChatbot(prompt);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickPrompts: res.quick_prompts
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `⚠️ **Connection Error**: Unable to reach AI SOC Gateway (${err.message || 'Error'}). Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick helper to render basic markdown formatting (*, `, **)
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      let formattedLine = line;
      // Bold **text**
      const parts = formattedLine.split(/(\*\*.*?\*\*|`.*?`)/g);

      return (
        <p key={lIdx} className="mb-1 leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-bold text-[#E8EEF0]">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code key={pIdx} className="bg-[#1A2024] text-cyan-400 font-mono px-1.5 py-0.5 rounded text-[11px] border border-cyan-500/20">
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 neu-button p-3.5 rounded-full flex items-center space-x-2.5 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 shadow-2xl transition-all transform hover:scale-105 group"
          title="Open IANSA AI SOC Security Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider hidden sm:inline pr-1 text-[#E8EEF0]">
            AI SOC Bot
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </button>
      )}

      {/* Interactive Chat Window Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 z-50 w-full max-w-md h-[550px] neu-raised flex flex-col border border-cyan-500/40 shadow-2xl overflow-hidden rounded-2xl animate-in slide-in-from-bottom-5">
          {/* Top Bar Header */}
          <div className="bg-[#121619] p-4 flex items-center justify-between border-b border-[#23292E]">
            <div className="flex items-center space-x-3">
              <div className="p-2 neu-pressed rounded-xl text-cyan-400">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-extrabold text-[#E8EEF0] uppercase tracking-wider">
                    IANSA AI SOC Assistant
                  </h3>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 rounded">
                    ONLINE
                  </span>
                </div>
                <p className="text-[10px] text-[#8D9AA0] mt-0.5 flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>Real-Time Context Enabled</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#8D9AA0] hover:text-[#E8EEF0] neu-button rounded-lg"
                title="Minimize Chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Feed Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#14181B] text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center space-x-1.5 text-[10px] text-[#8D9AA0]">
                    <span>{isUser ? 'You' : 'IANSA AI Assistant'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl max-w-[88%] text-xs ${
                      isUser
                        ? 'neu-pressed text-cyan-300 border border-cyan-500/30'
                        : 'neu-flat text-[#E8EEF0] border border-[#262C32]'
                    }`}
                  >
                    {renderFormattedText(msg.text)}

                    {/* Quick Prompts Chips */}
                    {msg.quickPrompts && msg.quickPrompts.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#262C32] flex flex-wrap gap-1.5">
                        {msg.quickPrompts.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => handleSend(chip)}
                            className="neu-button px-2.5 py-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 border border-cyan-500/20 rounded-md"
                          >
                            <Terminal className="w-2.5 h-2.5 text-amber-400" />
                            <span>{chip}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center space-x-2 text-[#8D9AA0] text-xs neu-flat p-3 rounded-xl w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Analyzing Security Telemetry...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#121619] border-t border-[#23292E] flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask AI about IP, Security Status, MTD..."
              className="flex-1 px-3 py-2 text-xs font-mono neu-input text-[#E8EEF0] focus:outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="neu-button p-2 text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
