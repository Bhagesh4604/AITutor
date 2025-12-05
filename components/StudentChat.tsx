

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Globe, Bell, Volume2, Square, StopCircle, Plus, MessageSquare, ChevronLeft, Menu, PanelLeftClose, PanelLeftOpen, Paperclip, Mic, X, Image as ImageIcon, FileText } from 'lucide-react';
import { getSocraticResponse, getSpeechForText, generateChatTitle, transcribeAudio } from '../services/geminiService';
import { db } from '../services/mockDatabase';
import { Message, UserRole, Sentiment, SupportedLanguage, TeacherMessage, ChatConversation, Attachment } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const StudentChat: React.FC = () => {
  const currentStudent = db.getCurrentStudent();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>(currentStudent.preferredLanguage || SupportedLanguage.ENGLISH);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);
  
  // Audio Playback State
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Teacher Inbox
  const [teacherMessages, setTeacherMessages] = useState<TeacherMessage[]>([]);
  const [showInbox, setShowInbox] = useState(false);

  // File & Voice Input State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load Conversations and Messages
  useEffect(() => {
    const convs = db.getConversations(currentStudent.id);
    setConversations(convs);

    if (convs.length > 0) {
      // If we don't have an active conversation, pick the most recent one
      if (!activeConvId) {
        setActiveConvId(convs[0].id);
        setMessages(convs[0].messages);
      } else {
        // If we do have an active ID, sync messages
        const active = convs.find(c => c.id === activeConvId);
        if (active) setMessages(active.messages);
      }
    } else {
      // Initialize fresh if empty
      handleNewChat();
    }
  }, [currentStudent.id, activeConvId]);

  // Update language immediately if student changes it in Profile or other tabs
  useEffect(() => {
    setLanguage(currentStudent.preferredLanguage || SupportedLanguage.ENGLISH);
  }, [currentStudent.id, currentStudent.preferredLanguage]);

  // Poll for messages
  useEffect(() => {
    const interval = setInterval(() => {
      setTeacherMessages(db.getStudentMessages(currentStudent.id));
    }, 2000);
    setTeacherMessages(db.getStudentMessages(currentStudent.id));
    return () => clearInterval(interval);
  }, [currentStudent.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, attachment]); // Scroll when attachment added

  const handleNewChat = () => {
    const newId = db.createNewConversation(currentStudent.id);
    setActiveConvId(newId);
    setMessages([]);
    
    // Add welcome message
    const welcome: Message = { 
      id: `welcome_${Date.now()}`, 
      role: 'model', 
      content: "Hello! I'm your AI Tutor. I'm here to help you learn, not just give you answers. What are we working on today?", 
      timestamp: Date.now() 
    };
    db.saveChatMessage(currentStudent.id, newId, welcome);
    // Refresh list
    setConversations(db.getConversations(currentStudent.id));
    
    // Mobile: close sidebar on selection
    if (window.innerWidth < 768) setShowHistorySidebar(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    const conv = conversations.find(c => c.id === id);
    if (conv) setMessages(conv.messages);
    if (window.innerWidth < 768) setShowHistorySidebar(false);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as SupportedLanguage;
    setLanguage(newLang);
    db.setStudentLanguage(currentStudent.id, newLang);
  };

  // --- File Handling ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64 = (event.target.result as string).split(',')[1];
        const type = file.type.startsWith('image/') ? 'image' : 'pdf';
        
        setAttachment({
          type: type,
          mimeType: file.type,
          data: base64,
          name: file.name
        });
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const removeAttachment = () => setAttachment(null);

  // --- Voice Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Transcribe
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setIsTyping(true); // Show loader while transcribing
          try {
            const text = await transcribeAudio(base64, 'audio/webm');
            setInput(prev => prev + (prev ? ' ' : '') + text);
          } catch (e) {
            console.error(e);
          } finally {
            setIsTyping(false);
          }
        };
        
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Mic error", e);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isTyping || !activeConvId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      attachment: attachment ? { ...attachment } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    db.saveChatMessage(currentStudent.id, activeConvId, userMsg);
    
    // Clear Input & Attachment
    setInput('');
    setAttachment(null);
    setIsTyping(true);

    // Auto-generate title logic...
    const currentConv = conversations.find(c => c.id === activeConvId);
    if (currentConv && currentConv.title === 'New Chat' && messages.length <= 1) {
       generateChatTitle(userMsg.content || "Image Upload").then(title => {
          db.updateConversationTitle(currentStudent.id, activeConvId, title);
          setConversations(db.getConversations(currentStudent.id));
       });
    }

    try {
      // Get AI Response in selected language, passing attachment data
      const response = await getSocraticResponse(
        messages, 
        userMsg.content, 
        language,
        userMsg.attachment 
          ? { mimeType: userMsg.attachment.mimeType, data: userMsg.attachment.data } 
          : undefined
      );

      // Add AI Message to UI
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.tutor_response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
      db.saveChatMessage(currentStudent.id, activeConvId, aiMsg);

      // Log the decision (XAI)
      db.addLog({
        studentId: currentStudent.id,
        studentInput: userMsg.content || "[Attachment]",
        aiOutput: response.tutor_response,
        reasoning: response.pedagogical_reasoning,
        timestamp: Date.now()
      });
      
      setConversations(db.getConversations(currentStudent.id));

    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReadAloud = async (text: string, msgId: string) => {
    if (playingMessageId === msgId) {
      setPlayingMessageId(null);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    setPlayingMessageId(msgId);
    
    try {
      const audioBytes = await getSpeechForText(text, currentStudent.preferredVoice || 'Kore');
      
      if (audioBytes) {
        if (audioContextRef.current) {
          await audioContextRef.current.close();
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
        
        const ctx = audioContextRef.current;
        if(ctx.state === 'suspended') await ctx.resume();

        const dataInt16 = new Int16Array(audioBytes.buffer);
        const float32 = new Float32Array(dataInt16.length);
        for(let i=0; i<dataInt16.length; i++) {
           float32[i] = dataInt16[i] / 32768.0;
        }

        const buffer = ctx.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => {
          setPlayingMessageId(null);
        };
        source.start();
      } else {
        setPlayingMessageId(null);
      }
    } catch (e) {
      console.error("Playback failed", e);
      setPlayingMessageId(null);
    }
  };

  // Group Conversations by Time
  const groupedConversations = conversations.reduce((groups, conv) => {
    const date = new Date(conv.updatedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key = 'Previous 7 Days';
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else if (today.getTime() - date.getTime() > 7 * 24 * 60 * 60 * 1000) {
      key = 'Older';
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(conv);
    return groups;
  }, {} as Record<string, ChatConversation[]>);

  // Order keys: Today, Yesterday, Previous 7 Days, Older
  const orderedKeys = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

  return (
    <div className="flex flex-row h-full gap-0 relative isolate overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
      
      {/* Animated History Sidebar */}
      <motion.div 
        initial={false}
        animate={{ 
          width: showHistorySidebar ? 280 : 0,
          opacity: showHistorySidebar ? 1 : 0,
          x: showHistorySidebar ? 0 : -20
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden whitespace-nowrap"
      >
         <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 h-[69px]">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-indigo-500" />
              History
            </h3>
            <button 
              onClick={() => setShowHistorySidebar(false)} 
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
         </div>

         <div className="p-4 shrink-0">
           <button 
               onClick={handleNewChat}
               className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg"
            >
               <Plus className="w-4 h-4" />
               <span>New Chat</span>
            </button>
         </div>

         <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
            {conversations.length === 0 && (
               <div className="text-center py-10 px-4 text-gray-400 text-xs">
                  No history yet. Start a new chat!
               </div>
            )}
            
            {orderedKeys.map(key => {
              const chats = groupedConversations[key];
              if (!chats || chats.length === 0) return null;
              return (
                <div key={key} className="mb-6">
                  <h4 className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{key}</h4>
                  <div className="space-y-1">
                    {chats.map(chat => (
                      <motion.button
                        key={chat.id}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSelectConversation(chat.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate flex items-center space-x-3 transition-all
                          ${activeConvId === chat.id 
                            ? 'bg-white dark:bg-gray-800 shadow-sm border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                          }
                        `}
                      >
                         <span className="truncate">{chat.title}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              );
            })}
         </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
        
        {/* Ambient Background Animation Layer */}
        <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
          <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] bg-purple-500/20 dark:bg-purple-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
        </div>

        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 z-20 shrink-0 h-[69px]">
          <div className="flex items-center space-x-3">
             {/* Sidebar Toggle (Visible only if sidebar hidden) */}
             <AnimatePresence>
               {!showHistorySidebar && (
                 <motion.button 
                   initial={{ scale: 0.8, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   exit={{ scale: 0.8, opacity: 0 }}
                   onClick={() => setShowHistorySidebar(true)}
                   className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                 >
                   <PanelLeftOpen className="w-5 h-5" />
                 </motion.button>
               )}
             </AnimatePresence>

            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 dark:text-white font-semibold text-sm">Socratic Tutor</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs">AI-Guided Learning</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Inbox Toggle */}
            <button 
              onClick={() => setShowInbox(!showInbox)}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {teacherMessages.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>

            {/* Language Selector */}
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1 border border-gray-200 dark:border-gray-700">
                <Globe className="w-3 h-3 text-gray-500" />
                <select 
                    value={language}
                    onChange={handleLanguageChange}
                    className="bg-transparent text-gray-700 dark:text-gray-300 text-xs font-medium focus:outline-none cursor-pointer"
                >
                    {Object.values(SupportedLanguage).map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                 <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 mx-2 ${msg.role === 'user' ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-purple-100 dark:bg-purple-900'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                 </div>
                 
                 <div className="flex flex-col">
                   <div
                     className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm backdrop-blur-sm transition-all duration-300 ${
                       msg.role === 'user'
                         ? 'bg-indigo-600 text-white rounded-tr-none'
                         : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                     }`}
                   >
                     {/* Render Attachment if present */}
                     {msg.attachment && (
                       <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                          {msg.attachment.type === 'image' ? (
                            <img 
                              src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} 
                              alt="Attachment" 
                              className="max-w-full max-h-60 object-contain bg-black/10"
                            />
                          ) : (
                            <div className="flex items-center space-x-2 p-3 bg-white/10">
                               <FileText className="w-5 h-5" />
                               <span className="truncate max-w-[150px]">{msg.attachment.name || 'Document.pdf'}</span>
                            </div>
                          )}
                       </div>
                     )}
                     {msg.content}
                   </div>
                   {/* Read Aloud Button for AI */}
                   {msg.role === 'model' && (
                      <button 
                        onClick={() => handleReadAloud(msg.content, msg.id)}
                        className={`self-start mt-2 text-xs flex items-center space-x-1.5 px-2 py-1 rounded-md transition-colors ${
                          playingMessageId === msg.id 
                            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium' 
                            : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                      >
                         {playingMessageId === msg.id ? (
                           <StopCircle className="w-3 h-3 fill-current" />
                         ) : (
                           <Volume2 className="w-3 h-3" />
                         )}
                         <span>{playingMessageId === msg.id ? 'Stop' : 'Read'}</span>
                         {playingMessageId === msg.id && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                      </button>
                   )}
                 </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start ml-12">
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 rounded-tl-none flex items-center space-x-3 border border-gray-100 dark:border-gray-700 shadow-sm">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-gray-500 dark:text-gray-400 text-xs font-medium animate-pulse">Thinking...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Attachment Preview Area */}
        {attachment && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center">
            <div className="flex items-center bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
              {attachment.type === 'image' ? <ImageIcon className="w-4 h-4 text-indigo-500 mr-2" /> : <FileText className="w-4 h-4 text-red-500 mr-2" />}
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{attachment.name}</span>
              <button onClick={removeAttachment} className="ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-1">
                <X className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white/80 dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-800 backdrop-blur-md shrink-0">
          <div className="flex items-center space-x-3 max-w-4xl mx-auto">
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
            />

            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              title="Attach Image or PDF"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "Listening..." : `Ask a question in ${language}...`}
              className="flex-1 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm shadow-sm placeholder:text-gray-400"
              disabled={isRecording}
            />
            
            {/* Mic/Send Button Toggle */}
            {input.trim() || attachment ? (
               <button
                 onClick={handleSend}
                 disabled={isTyping}
                 className="p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
               >
                 <Send className="w-5 h-5" />
               </button>
            ) : (
               <button
                 onClick={isRecording ? stopRecording : startRecording}
                 className={`p-3.5 rounded-xl transition-all shadow-md active:scale-95 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
               >
                 {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
               </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide-out Inbox */}
      {showInbox && (
        <div className="absolute right-0 top-16 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 animate-slide-in">
           <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
             <span className="font-bold text-gray-700 dark:text-gray-200">Teacher Messages</span>
             <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">{teacherMessages.length}</span>
           </div>
           <div className="overflow-y-auto h-full p-3 space-y-3 pb-20">
             {teacherMessages.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <Bell className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">No messages.</p>
               </div>
             ) : (
               teacherMessages.map(msg => (
                 <div key={msg.id} className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm">
                   <div className="flex justify-between items-start mb-1">
                     <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">{msg.teacherName}</span>
                     <span className="text-[10px] text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                   <p className="text-sm text-gray-700 dark:text-gray-200">{msg.content}</p>
                 </div>
               ))
             )}
           </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};