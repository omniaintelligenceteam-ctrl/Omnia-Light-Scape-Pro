import React, { useState } from "react";
import { X, Send, MessageCircle } from "lucide-react";

type Props = {
  currentView: string;
  isOpen: boolean;
  onClose: () => void;
};

export function Chatbot({ currentView, isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "Hi! I'm your lighting design assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    // Placeholder response since we removed the AI service
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm currently in maintenance mode. Please use the main editor to create your lighting designs!" 
      }]);
      setLoading(false);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[80] w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[60vh] animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-[#F6B45A]" />
          <span className="font-bold text-sm">Design Assistant</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl text-sm ${
              msg.role === "user"
                ? "bg-[#111] text-white ml-8"
                : "bg-gray-100 text-gray-800 mr-8"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="bg-gray-100 text-gray-500 p-3 rounded-xl text-sm mr-8 animate-pulse">
            Thinking...
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about lighting..."
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#F6B45A]"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2 bg-[#111] text-white rounded-xl hover:bg-black disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}