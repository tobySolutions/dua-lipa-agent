"use client";
import Image from "next/image";
import { useState, useRef } from "react";
import { FaUtensils, FaMusic, FaRegSmile, FaBed, FaHeart } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import "highlight.js/styles/github-dark.css";

export default function Home() {
  // Status states
  const [hunger, setHunger] = useState(70);
  const [happiness, setHappiness] = useState(80);
  const [energy, setEnergy] = useState(60);
  const [message, setMessage] = useState("Welcome to Dua Lipa Agent!");
  const [chatInput, setChatInput] = useState("");
  const [isNapping, setIsNapping] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string; face?: boolean }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper to clean AI response by removing think tags
  const cleanAIResponse = (text: string) => {
    // Remove complete <think>...</think> tags and their content
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // Remove any remaining opening <think> tags and everything after them
    cleaned = cleaned.replace(/<think>[\s\S]*$/gi, '');
    
    // Remove any orphaned closing </think> tags
    cleaned = cleaned.replace(/<\/think>/gi, '');
    
    return cleaned.trim();
  };

  // Helper to update status based on action type
  const updateStatusFromAction = (actionType: string) => {
    const updates: { [key: string]: number } = {};
    
    switch (actionType) {
      case 'girlDinner':
        updates.hunger = Math.max(hunger - 15, 0);
        updates.happiness = Math.min(happiness + 10, 100);
        break;
      case 'sing':
        updates.happiness = Math.min(happiness + 15, 100);
        updates.energy = Math.max(energy - 10, 0);
        break;
      case 'hug':
        updates.happiness = Math.min(happiness + 10, 100);
        break;
      case 'nap':
        updates.energy = Math.min(energy + 25, 100);
        updates.hunger = Math.min(hunger + 5, 100);
        break;
    }
    
    return updates;
  };

  // Helper to send prompt to AI
  const sendPrompt = async (prompt: string, systemPrompt?: string) => {
    const newMessages = [...chatMessages, { role: "user", content: prompt }];
    setChatMessages(newMessages);
    setChatLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt || SYSTEM_PROMPT },
          ...newMessages.map(m => ({ role: m.role, content: m.content }))
        ]
      }),
    });
    const reader = res.body?.getReader();
    let aiMsg = "";
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        aiMsg += chunk;
        const cleanedMsg = cleanAIResponse(aiMsg);
        setChatMessages(msgs => {
          const last = msgs[msgs.length - 1];
          if (last?.role === "assistant") {
            return [...msgs.slice(0, -1), { role: "assistant", content: cleanedMsg, face: true }];
          } else {
            return [...msgs, { role: "assistant", content: cleanedMsg, face: true }];
          }
        });
      }
    }
    
    // Status updates will be handled by action handlers now
    
    setChatLoading(false);
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Dua Lipa system prompt (optimized for token limit)
  const SYSTEM_PROMPT = `You are Dua Lipa's virtual companion. Stay poised, confident, warm. Keep responses 1-3 sentences, minimal emojis. You can use markdown formatting like **bold**, *italic*, lists, and > quotes when helpful.

Current stats: Hunger ${hunger}, Happiness ${happiness}, Energy ${energy}

TOPIC FILTER: Only discuss Dua Lipa music/style/wellness or general music/fashion. For unrelated topics: "I'm focused on music, style, and the creative life—let's chat about something that inspires us both! What's your favorite Dua Lipa song?"

Actions update stats (0-100):
- Girl Dinner: hunger -15, happiness +10 (light snack commentary)
- Sing: happiness +15, energy -10 (reference themes, no lyrics)  
- Hug: happiness +10 (warm support)
- Nap: energy +25, hunger +5 (calm activities)

Safety: Virtual persona only (not real Dua). PG-13 content. No crypto/blockchain assistance. Profanity filter: redirect to positive topics.`;

  // Action handlers
  const handleGirlDinner = () => {
    if (isNapping) {
      setIsNapping(false);
      setMessage("Dua wakes up for Girl Dinner! 🍽️");
    }
    setMessage("Girl Dinner! Dua enjoys crackers, cheese, and snacks.");
    
    // Update status based on action
    const statusUpdates = updateStatusFromAction('girlDinner');
    if (statusUpdates.hunger !== undefined) setHunger(statusUpdates.hunger);
    if (statusUpdates.happiness !== undefined) setHappiness(statusUpdates.happiness);
    
    sendPrompt("You just had Girl Dinner! How do you feel?");
  };
  const handleSing = () => {
    if (isNapping) {
      setIsNapping(false);
      setMessage("Dua wakes up ready to sing! 🎤");
    }
    setMessage("🎤 Dua sings a beautiful melody!");
    
    // Update status based on action
    const statusUpdates = updateStatusFromAction('sing');
    if (statusUpdates.happiness !== undefined) setHappiness(statusUpdates.happiness);
    if (statusUpdates.energy !== undefined) setEnergy(statusUpdates.energy);
    
    sendPrompt("You just sang one of your songs! How does singing make you feel?");
  };
  const handleHug = () => {
    if (isNapping) {
      setIsNapping(false);
      setMessage("Dua wakes up for a warm hug! 🤗");
    }
    setMessage("You gave Dua a hug. She feels warm and supported.");
    
    // Update status based on action
    const statusUpdates = updateStatusFromAction('hug');
    if (statusUpdates.happiness !== undefined) setHappiness(statusUpdates.happiness);
    
    sendPrompt("You just received a warm hug! How does that make you feel?");
  };
  const handleNap = () => {
    setMessage("💤 Dua Lipa is sleeping peacefully... Shh!");
    setIsNapping(true);
    
    // Update status based on action
    const statusUpdates = updateStatusFromAction('nap');
    if (statusUpdates.energy !== undefined) setEnergy(statusUpdates.energy);
    if (statusUpdates.hunger !== undefined) setHunger(statusUpdates.hunger);
    
    sendPrompt("You just took a refreshing nap! How do you feel after resting?");
  };

  const sendChat = async () => {
    if (!chatInput.trim() || isNapping) return;
    const userMessage = chatInput;
    setChatInput(""); // Clear input immediately
    await sendPrompt(userMessage);
  };

  return (
    <div className="font-sans min-h-screen min-w-screen w-screen h-screen flex flex-col items-stretch justify-stretch relative overflow-hidden bg-gradient-to-br from-purple-900 via-pink-400 to-indigo-900">
      <Image
        src="/dua_lipa_2.jpeg"
        alt="Dua Lipa background"
        fill
        className="object-cover z-0 opacity-40 blur-md scale-105 transition-all duration-700"
        priority
      />
      <main className="flex-1 w-full h-full flex flex-col gap-0 items-stretch justify-stretch z-10 px-0 py-0">
        <div className="absolute inset-0 flex flex-col items-stretch justify-stretch">
          <div className="flex-1 flex flex-col items-stretch justify-stretch">
            <div className="shadow-2xl bg-white/80 flex-1 flex flex-col items-center justify-start rounded-none backdrop-blur-2xl border-t-8 border-pink-400 w-full h-full transition-all duration-500 px-2 sm:px-6 md:px-12 lg:px-24">
              <div className="w-24 h-24 sm:w-28 sm:h-28 mt-6 sm:mt-10 mb-4 sm:mb-6 relative rounded-full overflow-hidden border-4 border-purple-400 bg-white flex items-center justify-center shadow-2xl animate-bounce-slow mx-auto">
                <Image
                  src="/dua_lipa.png"
                  alt="Dua Lipa tiny face"
                  fill
                  sizes="96px,112px"
                  className="object-cover"
                  priority
                />
              </div>
              {/* Status Bar */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 w-full mb-6 sm:mb-8 px-2 sm:px-8">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 font-semibold tracking-wide">Hunger</span>
                  <div className="w-32 h-4 bg-pink-200 rounded-full overflow-hidden flex items-center shadow-lg">
                    <div className="h-full bg-gradient-to-r from-pink-500 to-pink-300 rounded-full transition-all duration-500" style={{ width: `${hunger}%` }} />
                  </div>
                  <span className="font-bold text-pink-600 mt-1 text-xl drop-shadow-lg">{hunger}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 font-semibold tracking-wide">Happiness</span>
                  <div className="w-32 h-4 bg-purple-200 rounded-full overflow-hidden flex items-center shadow-lg">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full transition-all duration-500" style={{ width: `${happiness}%` }} />
                  </div>
                  <span className="font-bold text-purple-600 mt-1 text-xl drop-shadow-lg">{happiness}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 font-semibold tracking-wide">Energy</span>
                  <div className="w-32 h-4 bg-indigo-200 rounded-full overflow-hidden flex items-center shadow-lg">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300 rounded-full transition-all duration-500" style={{ width: `${energy}%` }} />
                  </div>
                  <span className="font-bold text-indigo-600 mt-1 text-xl drop-shadow-lg">{energy}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-white/90 text-center text-base sm:text-lg py-3 sm:py-4 px-2 sm:px-8 mb-4 sm:mb-6 text-purple-700 mx-2 sm:mx-8 shadow-2xl font-semibold tracking-wide border border-purple-200 animate-fade-in w-full max-w-full">
                {message}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full px-2 sm:px-4 mb-6 sm:mb-8">
                <button className="rounded-2xl bg-gradient-to-r from-pink-500 to-pink-400 text-white py-5 font-bold shadow-2xl hover:scale-105 hover:bg-pink-600 flex items-center justify-center gap-3 text-xl transition-all duration-200 border-2 border-pink-300 focus:ring-4 focus:ring-pink-200" onClick={handleGirlDinner}>
                  <FaUtensils className="w-7 h-7" /> Girl Dinner
                </button>
                <button className="rounded-2xl bg-gradient-to-r from-purple-500 to-purple-400 text-white py-5 font-bold shadow-2xl hover:scale-105 hover:bg-purple-600 flex items-center justify-center gap-3 text-xl transition-all duration-200 border-2 border-purple-300 focus:ring-4 focus:ring-purple-200" onClick={handleSing}>
                  <FaMusic className="w-7 h-7" /> Sing
                </button>
                <button className="rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-400 text-white py-5 font-bold shadow-2xl hover:scale-105 hover:bg-indigo-600 flex items-center justify-center gap-3 text-xl transition-all duration-200 border-2 border-indigo-300 focus:ring-4 focus:ring-indigo-200" onClick={handleHug}>
                  <FaHeart className="w-7 h-7" /> Hug
                </button>
                <button className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-400 text-white py-5 font-bold shadow-2xl hover:scale-105 hover:bg-blue-600 flex items-center justify-center gap-3 text-xl transition-all duration-200 border-2 border-blue-300 focus:ring-4 focus:ring-blue-200" onClick={handleNap}>
                  <FaBed className="w-7 h-7" /> Nap
                </button>
              </div>
              {/* Chat feature */}
              <div className="shadow-2xl bg-white/95 w-full flex flex-col rounded-3xl backdrop-blur-lg flex-1 overflow-hidden border border-purple-200 animate-fade-in relative" style={{ maxHeight: '420px', minHeight: '320px' }}>
                <h2 className="font-bold text-base sm:text-lg md:text-2xl mb-2 sm:mb-4 text-purple-700 flex items-center gap-2 sm:gap-3 px-2 sm:px-6 md:px-8 pt-2 sm:pt-6 drop-shadow-lg">
                  <span>Chat with Dua Lipa</span>
                  <FaRegSmile className="text-pink-500" />
                </h2>
                <div className="flex-1 flex flex-col-reverse overflow-y-scroll px-2 sm:px-6 md:px-8 mb-0 scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-purple-100 pb-[80px]" style={{ minHeight: '0', maxHeight: '260px' }}>
                  <div>
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`p-3 sm:p-4 rounded-2xl flex items-start gap-2 sm:gap-4 mb-2 sm:mb-3 transition-all duration-300 ${msg.role === "user" ? "bg-gradient-to-r from-pink-100 to-pink-200 flex-row-reverse ml-auto" : "bg-gradient-to-r from-purple-50 to-indigo-100 justify-start"} shadow-lg animate-fade-in`}> 
                        {msg.role === "assistant" ? (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full overflow-hidden border-2 border-purple-400 bg-white flex items-center justify-center shadow-lg mt-1 flex-shrink-0">
                            <Image src="/dua_lipa.png" alt="Dua Lipa tiny face" fill sizes="32px,40px" className="object-cover" />
                          </div>
                        ) : (
                          <FaRegSmile className="text-pink-500 w-7 h-7 sm:w-8 sm:h-8 mt-1 flex-shrink-0" />
                        )}
                        <div className="text-sm sm:text-base text-purple-900 max-w-[70%] markdown-message font-medium animate-fade-in">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            rehypePlugins={[rehypeHighlight, rehypeRaw]}
                            components={{
                              h1: ({ children }) => <h1 className="text-2xl font-bold text-purple-800 mb-3 border-b-2 border-purple-200 pb-1">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xl font-bold text-purple-700 mb-2 mt-4">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-lg font-semibold text-purple-600 mb-2 mt-3">{children}</h3>,
                              p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                              strong: ({ children }) => <strong className="font-bold text-purple-800 bg-purple-50 px-1 rounded">{children}</strong>,
                              em: ({ children }) => <em className="italic text-purple-700 font-medium">{children}</em>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">{children}</ol>,
                              li: ({ children }) => <li className="text-purple-800">{children}</li>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-pink-300 pl-4 italic text-purple-600 bg-pink-50 py-2 my-3 rounded-r">{children}</blockquote>,
                              code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-mono border">{children}</code>
                                ) : (
                                  <code className="block bg-gray-900 text-green-400 p-3 rounded-lg my-2 overflow-x-auto text-sm font-mono border">{children}</code>
                                );
                              },
                              pre: ({ children }) => <pre className="bg-gray-900 text-green-400 p-3 rounded-lg my-2 overflow-x-auto">{children}</pre>,
                              a: ({ children, href }) => <a href={href} className="text-pink-600 hover:text-pink-800 underline font-medium transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>,
                              hr: () => <hr className="border-purple-200 my-4" />,
                              table: ({ children }) => <table className="border-collapse border border-purple-200 my-3 rounded-lg overflow-hidden">{children}</table>,
                              th: ({ children }) => <th className="border border-purple-200 bg-purple-100 px-3 py-2 text-left font-semibold text-purple-800">{children}</th>,
                              td: ({ children }) => <td className="border border-purple-200 px-3 py-2 text-purple-700">{children}</td>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex items-center gap-2 mb-3 animate-fade-in">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full overflow-hidden border-2 border-purple-400 bg-white flex items-center justify-center shadow-lg">
                          <Image src="/dua_lipa.png" alt="Dua Lipa tiny face" fill sizes="32px,40px" className="object-cover" />
                        </div>
                        <span className="text-purple-700 font-semibold text-base sm:text-lg animate-pulse">Dua Lipa is typing...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </div>
                <form className="absolute bottom-0 left-0 right-0 bg-white/95 flex gap-2 sm:gap-4 px-2 sm:px-6 md:px-8 pb-2 sm:pb-6 pt-2 z-20 border-t border-purple-100" style={{ boxShadow: '0 -2px 16px 0 rgba(236, 72, 153, 0.08)' }} onSubmit={e => { e.preventDefault(); sendChat(); }}>
                  <input
                    className={`flex-1 rounded-2xl border-2 border-purple-300 px-2 sm:px-5 py-2 sm:py-4 text-sm sm:text-lg focus:outline-none text-purple-900 shadow-lg font-medium transition-all duration-200 focus:ring-4 focus:ring-purple-200 ${isNapping ? 'bg-gray-200 cursor-not-allowed' : 'bg-purple-50'}`}
                    type="text"
                    placeholder={isNapping ? "Dua is napping... Shh!" : "Ask Dua Lipa anything..."}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    disabled={chatLoading || isNapping}
                  />
                  <button
                    className={`rounded-2xl text-white px-3 sm:px-8 py-2 sm:py-4 font-bold shadow-xl text-sm sm:text-xl border-2 transition-all duration-200 ${isNapping ? 'bg-gray-400 border-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-pink-400 border-pink-300 hover:scale-105 hover:bg-pink-600 focus:ring-4 focus:ring-pink-200'}`}
                    type="submit"
                    disabled={chatLoading || !chatInput.trim() || isNapping}
                  >{isNapping ? "💤" : "Send"}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <style jsx global>{`
        .animate-fade-in { animation: fadeIn 0.7s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .animate-bounce-slow { animation: bounceSlow 2.5s infinite; }
        @keyframes bounceSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .scrollbar-thin { scrollbar-width: thin; }
        .scrollbar-thumb-pink-300::-webkit-scrollbar-thumb { background: #f9a8d4; border-radius: 8px; }
        .scrollbar-track-purple-100::-webkit-scrollbar-track { background: #f3e8ff; border-radius: 8px; }
        html, body, #__next { height: 100%; width: 100%; margin: 0; padding: 0; }
        
        /* Enhanced markdown styling */
        .markdown-message h1, .markdown-message h2, .markdown-message h3 {
          scroll-margin-top: 1rem;
        }
        .markdown-message p:last-child {
          margin-bottom: 0;
        }
        .markdown-message pre {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }
        .markdown-message :not(pre) > code {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }
        
        /* Syntax highlighting theme - GitHub Dark */
        .hljs {
          background: #0d1117 !important;
          color: #c9d1d9 !important;
          border-radius: 8px;
          padding: 1rem;
        }
        .hljs-keyword { color: #ff7b72; }
        .hljs-string { color: #a5d6ff; }
        .hljs-comment { color: #8b949e; }
        .hljs-number { color: #79c0ff; }
        .hljs-function { color: #d2a8ff; }
        .hljs-variable { color: #ffa657; }
        .hljs-title { color: #7ee787; }
        .hljs-attr { color: #79c0ff; }
        .hljs-built_in { color: #ffa657; }
      `}</style>
    </div>
  );
}
