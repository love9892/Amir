import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Newspaper, 
  Database, 
  Mic, 
  Send, 
  Paperclip, 
  Menu, 
  X, 
  Settings, 
  History, 
  Plus, 
  ChevronRight,
  Download,
  Eye,
  Trash2,
  StopCircle,
  Volume2
} from "lucide-react";
import { cn, Message, NewsItem } from "./lib/utils";
import { AIOrb } from "./components/AIOrb";
import { generateChatResponse, generateImage, analyzeData } from "./lib/gemini";
import Markdown from "react-markdown";

type ViewMode = "home" | "chat" | "news" | "analysis" | "images";

export default function App() {
  const [view, setView] = useState<ViewMode>("home");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("mr-amirai-history");
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // Save chat history
  useEffect(() => {
    localStorage.setItem("mr-amirai-history", JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (text: string = "") => {
    const messageContent = text || input;
    if (!messageContent.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    if (view !== "chat") setView("chat");

    try {
      const response = await generateChatResponse([...messages, userMessage]);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response || "I'm sorry, I couldn't process that.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      handleSend(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const speak = (text: string) => {
    const synth = window.speechSynthesis;
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synth.speak(utterance);
  };

  const handleImageGen = async (prompt: string) => {
    setIsLoading(true);
    setView("images");
    try {
      const imageUrl = await generateImage(prompt);
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Generated image for: ${prompt}`,
        timestamp: Date.now(),
        type: "image",
        imageUrl,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setIsLoading(true);
      setView("analysis");
      try {
        const analysis = await analyzeData(content, `File name: ${file.name}`);
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: analysis || "Analysis failed.",
          timestamp: Date.now(),
          type: "analysis"
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-[#00ffa3]/30">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 touch-none"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: isSidebarOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 left-0 h-full w-4/5 max-w-sm bg-[#121212] border-r border-white/5 z-50 p-6 flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00ffa3] text-black flex items-center justify-center font-bold">MR</div>
            <span className="font-bold text-xl tracking-tight">AMIRAI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
            <X size={20} />
          </button>
        </div>

        <button 
          onClick={() => { setMessages([]); setIsSidebarOpen(false); setView("home"); }}
          className="flex items-center gap-3 w-full p-4 mb-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
        >
          <Plus size={20} className="text-[#00ffa3]" />
          <span className="font-medium">New Chat</span>
        </button>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-white/30 px-4 py-2 uppercase tracking-widest">Navigation</div>
          {[
            { id: "home", label: "Home", icon: MessageSquare },
            { id: "news", label: "Latest News", icon: Newspaper },
            { id: "analysis", label: "Data Analysis", icon: Database },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id as ViewMode); setIsSidebarOpen(false); }}
              className={cn(
                "flex items-center justify-between w-full p-4 rounded-xl hover:bg-white/5 transition-colors group",
                view === item.id ? "bg-white/5 text-[#00ffa3]" : "text-white/60"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}

          <div className="text-xs font-semibold text-white/30 px-4 py-2 mt-6 uppercase tracking-widest">History</div>
          {messages.length > 0 ? (
            <div className="px-4 py-2 text-sm text-white/40 italic">Recent activity found...</div>
          ) : (
            <div className="px-4 py-2 text-sm text-white/40 italic">No history yet</div>
          )}
        </nav>

        <div className="pt-6 border-t border-white/5 space-y-2">
          <button className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-white/5 text-white/60 transition-colors text-left">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full h-full max-w-2xl mx-auto border-x border-white/5 shadow-2xl">
        {/* Header */}
        <header className="absolute top-0 w-full p-4 flex items-center justify-between bg-black/20 backdrop-blur-md z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-full bg-white/5 border border-white/10 shrink-0">
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[#00ffa3] animate-pulse" />
             <span className="text-xs font-bold tracking-widest text-white/30 uppercase">AmirAI Pro</span>
          </div>

          <button className="p-2 hover:bg-white/5 rounded-full bg-white/5 border border-white/10 shrink-0">
            <History size={20} />
          </button>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto pt-20 pb-24 scroll-smooth">
          {view === "home" && (
            <div className="h-full flex flex-col items-center justify-center p-6 space-y-12">
              <AIOrb />
              
              <div className="text-center space-y-3 px-4">
                <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">How can I help you?</h1>
                <p className="text-white/40 max-w-xs mx-auto text-sm leading-relaxed">
                  Your premium AI companion is ready.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {[
                  { icon: ImageIcon, label: "Create Image", onClick: () => handleImageGen("A futuristic neon city at night") },
                  { icon: Newspaper, label: "Latest News", onClick: () => setView("news") },
                  { icon: Eye, label: "Get Advice", onClick: () => handleSend("I need some life advice.") },
                  { icon: Database, label: "Analyze Data", onClick: () => setView("analysis") },
                ].map((btn, i) => (
                  <motion.button
                    key={btn.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    onClick={btn.onClick}
                    className="flex flex-col items-center gap-3 p-4 bg-[#121212] border border-white/5 rounded-2xl hover:bg-[#1a1a1a] transition-all group"
                  >
                    <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-[#00ffa3]/10 group-hover:text-[#00ffa3] transition-colors">
                      <btn.icon size={22} />
                    </div>
                    <span className="text-xs font-medium tracking-tight text-[#dfdfdf]">{btn.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {(view === "chat" || view === "images" || view === "analysis") && (
            <div className="p-4 space-y-6 max-w-full">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col gap-2 max-w-[85%]",
                    msg.role === "user" ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === "user" 
                      ? "bg-[#121212] border border-white/10 text-white rounded-tr-none" 
                      : "bg-[#121212] border border-white/5 text-white/90 rounded-tl-none"
                  )}>
                    {msg.type === "image" ? (
                      <div className="space-y-3">
                        <img src={msg.imageUrl} className="rounded-xl w-full aspect-square object-cover" alt="AI Generated" />
                        <div className="flex gap-2">
                           <button className="flex-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center gap-2 text-xs font-medium">
                             <Download size={14} /> Download
                           </button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Markdown>
                          {msg.content}
                        </Markdown>
                      </div>
                    )}
                  </div>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 ml-1">
                      <button 
                        onClick={() => speak(msg.content)}
                        className={cn(
                          "p-2 rounded-full hover:bg-white/5 transition-colors",
                          isSpeaking ? "text-[#00ffa3]" : "text-white/40"
                        )}
                      >
                         <Volume2 size={14} />
                      </button>
                      <button className="p-2 text-white/40 hover:bg-white/5 rounded-full">
                        <Trash2 size={14} />
                      </button>
                      <span className="text-[10px] text-white/20 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-2 items-start max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center animate-pulse">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  </div>
                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl animate-pulse text-white/40 text-sm">
                    MR AMIRAI is thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {view === "news" && (
            <div className="p-6 space-y-8 h-full overflow-y-auto">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
                <p className="text-white/40 text-sm">Today's top stories in search and AI.</p>
              </div>
              <div className="space-y-4">
                {[
                  { title: "The Future of Multimodal AI", date: "2 hours ago", desc: "How Gemini 1.5 is changing long-context understanding." },
                  { title: "Imagen 3: Pro Grade Image Gen", date: "5 hours ago", desc: "Breakthroughs in realistic text-to-image synthesis." },
                  { title: "AI in Clinical Medicine", date: "1 day ago", desc: "New research shows AI outperforming doctors in early diagnosis." },
                ].map((news, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 bg-[#121212] border border-white/5 rounded-2xl space-y-2 hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-widest text-[#00ffa3] uppercase">{news.date}</span>
                      <ChevronRight size={14} className="text-white/20 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-medium leading-tight">{news.title}</h3>
                    <p className="text-sm text-white/40 line-clamp-2">{news.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {view === "analysis" && messages.filter(m => m.type === "analysis").length === 0 && (
            <div className="h-full flex flex-col items-center justify-center p-8 space-y-6 text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#00ffa3]/10 flex items-center justify-center text-[#00ffa3]">
                <Database size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-medium">Data Analysis</h2>
                <p className="text-white/40 text-sm max-w-xs mx-auto">Upload a text or CSV file for detailed AI insights and pattern recognition.</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-[#00ffa3] text-black font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all"
              >
                Upload File
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.csv" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent z-30">
          <div className="relative max-w-full bg-[#121212] border border-white/10 rounded-[28px] p-1.5 flex items-end gap-1 shadow-2xl">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-white/40 hover:text-white transition-colors"
            >
              <Plus size={20} />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message AMIRAI..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-1 resize-none max-h-32 text-white placeholder:text-white/30 min-h-[44px]"
              rows={1}
            />
            <div className="flex gap-1">
              {isListening ? (
                <button 
                  onClick={() => setIsListening(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-red-500 animate-pulse"
                >
                  <StopCircle size={20} />
                </button>
              ) : (
                <button 
                  onClick={startVoiceInput}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                >
                  <Mic size={20} />
                </button>
              )}
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full transition-all shrink-0",
                  input.trim() ? "bg-[#00ffa3] text-black" : "bg-white/5 text-white/20"
                )}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className="mt-4 w-24 h-1 bg-white/10 mx-auto rounded-full" />
        </div>
      </main>

      {/* Listening Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#00ffa3]/5 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#00ffa3] rounded-full animate-ping opacity-20" />
              <div className="relative w-24 h-24 rounded-full bg-[#00ffa3] flex items-center justify-center shadow-[0_0_50px_rgba(0,255,163,0.5)] text-black">
                <Mic size={40} />
              </div>
            </div>
            <h2 className="mt-12 text-3xl font-medium tracking-tight">Listening...</h2>
            <p className="mt-4 text-[#00ffa3]/80 font-medium tracking-wide">Speak clearly to AMIRAI</p>
            <button 
              onClick={() => setIsListening(false)}
              className="mt-12 px-8 py-3 bg-white/5 border border-white/10 rounded-full font-bold hover:bg-white/10"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
