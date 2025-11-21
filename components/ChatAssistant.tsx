import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Sparkles, Image as ImageIcon, Trash2 } from 'lucide-react';
import { chatWithStylist } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ChatAssistantProps {
  activeImage?: string | null; // Base64 from parent
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ activeImage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'Hi! I am your personal AI Stylist. Ask me for outfit ideas, color combinations, or send me a photo description!', timestamp: Date.now() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Local state for the image currently being "attached" to the next message
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // When the parent activeImage changes (user uploads something new), allow it to be attached
  useEffect(() => {
    if (activeImage) {
      setPendingImage(activeImage);
    }
  }, [activeImage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() && !pendingImage) return;

    const currentImage = pendingImage;
    setPendingImage(null); // Clear pending after sending

    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: input, 
      image: currentImage || undefined,
      timestamp: Date.now() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare history for API
    // Reconstruct history including images if they exist in previous messages
    const history = messages
      .filter(m => m.id !== 'init')
      .map(m => {
        const parts: any[] = [];
        if (m.image) {
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: m.image } });
        }
        if (m.text) {
          parts.push({ text: m.text });
        }
        return {
          role: m.role,
          parts: parts
        };
      });

    try {
      // Pass the history and the *current* input message
      // If there is an image, we pass it as the third argument
      const response = await chatWithStylist(history, userMsg.text, currentImage || undefined);
      
      const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response || "I couldn't quite catch that. Could you rephrase?", 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition z-50 flex items-center gap-2"
      >
        <MessageCircle size={28} />
        <span className="hidden md:inline font-medium">Chat with AI</span>
        {pendingImage && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] max-w-[350px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 z-50 overflow-hidden font-sans h-[500px] max-h-[80vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-yellow-300" />
          <div>
            <h3 className="font-semibold leading-tight">FitMatch AI</h3>
            <p className="text-xs text-indigo-100 opacity-80">Personal Stylist</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {/* Image in chat bubble */}
            {msg.image && (
              <div className={`mb-1 max-w-[85%] overflow-hidden rounded-2xl border-2 ${msg.role === 'user' ? 'border-indigo-600' : 'border-gray-200'}`}>
                <img 
                  src={`data:image/jpeg;base64,${msg.image}`} 
                  alt="Uploaded context" 
                  className="max-h-40 object-cover"
                />
              </div>
            )}
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100 flex flex-col gap-2">
        {/* Image Preview Attachment */}
        {pendingImage && (
          <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100 animate-slide-up">
            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
              <img src={`data:image/jpeg;base64,${pendingImage}`} className="w-full h-full object-cover" alt="Attachment" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-indigo-900">Image attached</p>
              <p className="text-[10px] text-indigo-600">AI will analyze this</p>
            </div>
            <button onClick={() => setPendingImage(null)} className="p-1 text-gray-400 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          {/* If no image pending, and we have an activeImage in history but maybe user wants to re-attach? 
              For now simpler interface. */}
          {!pendingImage && activeImage && (
             <button 
               onClick={() => setPendingImage(activeImage)}
               className="p-2 text-gray-400 hover:text-indigo-600 transition"
               title="Attach current image"
             >
               <ImageIcon size={20} />
             </button>
          )}
          
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={pendingImage ? "Ask about this image..." : "Ask for style advice..."}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <button 
            onClick={handleSend}
            disabled={(!input.trim() && !pendingImage) || isLoading}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;