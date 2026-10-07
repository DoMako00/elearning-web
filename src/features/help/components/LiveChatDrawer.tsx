import React, { useState } from "react";
import { X, Send, Bot } from "lucide-react";

interface LiveChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

export const LiveChatDrawer: React.FC<LiveChatDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hello! Welcome to GreenLearn Live Support. How can we assist you today?",
      time: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState("");

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Simulated support agent auto-reply
    setTimeout(() => {
      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Thanks for reaching out! A support specialist has received your inquiry and is reviewing it now. Expected response in < 2 minutes.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botReply]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      {/* Drawer Header */}
      <div className="p-3.5 sm:p-4 bg-emerald-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-emerald-800" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold leading-tight">GreenLearn Support</h3>
            <p className="text-[10px] text-emerald-200 flex items-center gap-1">
              <span>Online</span> • <span>Typically replies in 2m</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Feed */}
      <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-50/50 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[82%] p-3 rounded-2xl ${
                msg.sender === "user"
                  ? "bg-emerald-600 text-white rounded-br-xs"
                  : "bg-white text-gray-800 border border-gray-200/70 shadow-2xs rounded-bl-xs"
              }`}
            >
              <p className="leading-relaxed">{msg.text}</p>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-2.5 border-t border-gray-100 bg-white flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your question..."
          className="flex-1 h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
        />
        <button
          type="submit"
          className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
