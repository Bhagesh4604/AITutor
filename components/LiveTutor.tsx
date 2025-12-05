

import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, Volume2, AlertCircle, Clapperboard, X, Play, Globe, Monitor, StopCircle, User, ArrowLeft, History, FileText } from 'lucide-react';
import { db } from '../services/mockDatabase';
import { createPcmBlob, decodeAudioData, base64ToUint8Array, arrayBufferToBase64, AUDIO_SAMPLE_RATE_INPUT, AUDIO_SAMPLE_RATE_OUTPUT } from '../services/audioUtils';
import { SupportedLanguage, AIVoice, TranscriptItem, LiveSession } from '../types';

interface LiveTutorProps {
  onBack?: () => void;
}

export const LiveTutor: React.FC<LiveTutorProps> = ({ onBack }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // History / Transcript State
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [currentInput, setCurrentInput] = useState(''); // Current accumulating user text
  const [currentOutput, setCurrentOutput] = useState(''); // Current accumulating AI text
  const [showHistory, setShowHistory] = useState(false);
  const [pastSessions, setPastSessions] = useState<LiveSession[]>([]);
  const sessionStartTimeRef = useRef<number>(0);

  // Screen Share State
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenIntervalRef = useRef<number | null>(null);

  // Video Gen State
  const [showVideoPrompt, setShowVideoPrompt] = useState(false);
  const [videoPromptInput, setVideoPromptInput] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // State Refs for Closures (Audio Loop)
  const connectedRef = useRef(false);
  const sessionRef = useRef<any>(null); // To store the active session object for sending frames
  
  // Analyzer for visualizer
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const student = db.getCurrentStudent();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(student.preferredLanguage);
  const [selectedVoice, setSelectedVoice] = useState<AIVoice>(student.preferredVoice || AIVoice.Kore);

  // Sync selected language/voice if student changes
  useEffect(() => {
    setSelectedLanguage(student.preferredLanguage);
    setSelectedVoice(student.preferredVoice || AIVoice.Kore);
    setPastSessions(db.getLiveSessions(student.id));
  }, [student.id, student.preferredLanguage, student.preferredVoice]);

  // Cleanup Function
  const cleanupAudio = async () => {
    // Save session if we have transcript data
    if (transcript.length > 0 && sessionStartTimeRef.current > 0) {
      const session: LiveSession = {
        id: `sess_${Date.now()}`,
        startTime: sessionStartTimeRef.current,
        endTime: Date.now(),
        transcript: [...transcript]
      };
      db.saveLiveSession(student.id, session);
      setPastSessions(prev => [session, ...prev]);
    }
    
    // Reset Transcript State
    setTranscript([]);
    setCurrentInput('');
    setCurrentOutput('');
    sessionStartTimeRef.current = 0;

    connectedRef.current = false;
    sessionRef.current = null;

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop all playing audio
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    activeSourcesRef.current.clear();

    // Close contexts
    if (inputContextRef.current && inputContextRef.current.state !== 'closed') {
      try { await inputContextRef.current.close(); } catch (e) {}
    }
    inputContextRef.current = null;

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { await audioContextRef.current.close(); } catch (e) {}
    }
    audioContextRef.current = null;
  };

  const stopScreenShare = () => {
    if (screenIntervalRef.current) {
      clearInterval(screenIntervalRef.current);
      screenIntervalRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  };

  const handleDisconnect = () => {
    stopScreenShare();
    cleanupAudio();
    setIsConnected(false);
    setIsConnecting(false);
    connectedRef.current = false;
  };

  const startSession = async () => {
    if (!process.env.API_KEY) {
      setErrorMessage("API Key is missing in environment variables.");
      return;
    }

    if (isConnecting) return;
    
    try {
      setIsConnecting(true);
      setErrorMessage(null);
      await cleanupAudio(); // Ensure clean slate

      // 1. Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: AUDIO_SAMPLE_RATE_OUTPUT });
      inputContextRef.current = new AudioContextClass({ sampleRate: AUDIO_SAMPLE_RATE_INPUT });

      // Resume contexts (browser policy)
      await Promise.all([
        audioContextRef.current.resume(),
        inputContextRef.current.resume(),
      ]);

      // 2. Setup Visualizer Analyzer
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      analyzerRef.current.connect(audioContextRef.current.destination);

      // 3. Get User Media (Mic & Cam)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 4. Initialize Gemini Live Session
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are H²-ALA, a human-like AI tutor and Expert Engineering Assistant. 
          The student has selected ${selectedLanguage} as their communication language.
          
          CORE ROLES:
          1. **Socratic Tutor:** Explain concepts, guide learning.
          2. **Coding Companion:** If the student shares their screen showing code:
             - Analyze the visible code.
             - Identify syntax errors, logical bugs, or inefficiencies.
             - EXPLAIN the fix in ${selectedLanguage} (e.g., "In Python, indentation is key...").
             - Do not just dictate code; explain the *concept* of the fix.
          
          LANGUAGE RULES:
          - Speak ONLY in ${selectedLanguage}.
          - Use English for code keywords (e.g., "for loop", "variable", "function") if standard in ${selectedLanguage}.
          
          Keep responses concise. If they show a screen, acknowledge it immediately (e.g., "I see your code. Let's look at that loop...").`,
        },
      };

      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Socket Opened");
            sessionStartTimeRef.current = Date.now();
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              try {
                const uint8 = base64ToUint8Array(audioData);
                const audioBuffer = await decodeAudioData(uint8, audioContextRef.current);
                playAudioChunk(audioBuffer);
              } catch (e) {
                console.error("Error decoding audio chunk", e);
              }
            }

            // Handle Transcription
            // User Input
            const userInput = msg.serverContent?.inputTranscription?.text;
            if (userInput) {
               setCurrentInput(prev => prev + userInput);
            }
            // Model Output
            const modelOutput = msg.serverContent?.outputTranscription?.text;
            if (modelOutput) {
               setCurrentOutput(prev => prev + modelOutput);
            }

            // Turn Complete - Commit to transcript history
            if (msg.serverContent?.turnComplete) {
               setTranscript(prev => {
                 const newItems: TranscriptItem[] = [];
                 if (currentInput.trim()) {
                    newItems.push({ role: 'user', text: currentInput, timestamp: Date.now() });
                 }
                 if (currentOutput.trim()) {
                    newItems.push({ role: 'model', text: currentOutput, timestamp: Date.now() });
                 }
                 return [...prev, ...newItems];
               });
               // Reset buffers
               setCurrentInput('');
               setCurrentOutput('');
            }
          },
          onclose: () => {
            console.log("Gemini Live Closed");
            handleDisconnect();
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            setErrorMessage("Connection error. Please try again.");
            handleDisconnect();
          }
        }
      });

      // Handle successful connection logic
      sessionPromise.then((session) => {
        sessionRef.current = session;
        connectedRef.current = true;
        setIsConnected(true);
        setIsConnecting(false);
        setupAudioInput(); // Initialize input only after session is ready
        startVisualizer();
      }).catch((err) => {
        console.error("Connection Handshake Failed:", err);
        if (err.message && err.message.includes("invalid argument")) {
          setErrorMessage("Configuration Error: Invalid argument sent to API.");
        } else {
          setErrorMessage("Network Error: Could not establish connection.");
        }
        handleDisconnect();
      });

    } catch (error: any) {
      console.error("Session Start Error:", error);
      setErrorMessage(error.message || "Failed to start session.");
      handleDisconnect();
    }
  };

  const setupAudioInput = () => {
    if (!inputContextRef.current || !streamRef.current) return;

    const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
    sourceRef.current = source;

    // Use ScriptProcessor for raw PCM access (bufferSize: 4096)
    const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (!isMicOn || !connectedRef.current || !sessionRef.current) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);

      try {
        sessionRef.current.sendRealtimeInput({ media: pcmBlob });
      } catch (err) {
        // Ignored to prevent loop crash
      }
    };

    source.connect(processor);
    processor.connect(inputContextRef.current.destination);
  };

  const handleScreenShare = async () => {
    if (!isConnected) {
      alert("Please start the live session first.");
      return;
    }

    try {
      setErrorMessage(null); // Clear previous errors
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      setIsScreenSharing(true);

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        screenVideoRef.current.onloadedmetadata = () => {
          screenVideoRef.current?.play();
          startScreenStreaming();
        };
      }

      // Handle user clicking "Stop Sharing" on the browser native UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

    } catch (err: any) {
      // Gracefully handle user cancellation
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        console.log("User cancelled screen sharing.");
        setIsScreenSharing(false);
        setErrorMessage(null);
        return;
      }

      console.error("Error sharing screen:", err);
      setIsScreenSharing(false);
      
      if (err.message && err.message.includes('permissions policy')) {
         setErrorMessage("Screen sharing is blocked by the environment policy. Try opening in a new window.");
      } else {
         setErrorMessage("Failed to share screen. " + (err.message || ''));
      }
    }
  };

  const startScreenStreaming = () => {
    if (!screenVideoRef.current || !screenCanvasRef.current) return;

    // Stream at 1 FPS to save bandwidth/processing while being sufficient for code reading
    screenIntervalRef.current = window.setInterval(async () => {
      if (!connectedRef.current || !sessionRef.current || !screenVideoRef.current || !screenCanvasRef.current) return;

      const video = screenVideoRef.current;
      const canvas = screenCanvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.videoWidth > 0) {
        // Resize to something reasonable for ML (e.g., max 1024px width)
        const scale = Math.min(1024 / video.videoWidth, 1);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to Blob -> Base64
        canvas.toBlob(async (blob) => {
          if (blob) {
             const buffer = await blob.arrayBuffer();
             const base64Data = arrayBufferToBase64(buffer);
             
             if (connectedRef.current && sessionRef.current) {
               try {
                  sessionRef.current.sendRealtimeInput({
                    media: { 
                      mimeType: 'image/jpeg', 
                      data: base64Data 
                    }
                  });
               } catch(e) { /* ignore */ }
             }
          }
        }, 'image/jpeg', 0.6); // 60% quality JPEG
      }
    }, 1000); 
  };

  const playAudioChunk = (buffer: AudioBuffer) => {
    if (!audioContextRef.current || !analyzerRef.current) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(analyzerRef.current);

    const currentTime = audioContextRef.current.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
    
    activeSourcesRef.current.add(source);
    source.onended = () => activeSourcesRef.current.delete(source);
  };

  const startVisualizer = () => {
    const render = () => {
      if (!analyzerRef.current || !avatarCanvasRef.current || !connectedRef.current) return;
      
      const canvas = avatarCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzerRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Dynamic Aura
      const radius = 60 + (average * 0.5);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(99, 102, 241, ${Math.min(0.6, average / 128)})`; 
      ctx.fill();
      
      // Border Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(99, 102, 241, ${Math.min(1, average / 64)})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
  };

  // --- VEO VIDEO GENERATION LOGIC ---
  const handleGenerateVideo = async () => {
    if (!videoPromptInput.trim()) return;
    
    // 1. Check & Request API Key for Veo (Paid Model)
    try {
       const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
       if (!hasKey) {
          const success = await (window as any).aistudio?.openSelectKey();
          // If user cancels or fails, stop
          if(!success && !(window as any).aistudio?.hasSelectedApiKey()) return;
       }
    } catch(e) {
       console.warn("AI Studio Key Check failed (dev env?)", e);
    }

    setIsGeneratingVideo(true);
    setShowVideoPrompt(false);
    
    try {
       // Create fresh instance with potentially new key
       const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
       
       console.log("Starting Video Gen for:", videoPromptInput);
       
       let operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: `Educational animation explaining ${videoPromptInput}. Clear visuals, simple math diagrams, high contrast, suitable for a tutor interface. Language context: ${selectedLanguage}.`,
          config: {
             numberOfVideos: 1,
             resolution: '720p',
             aspectRatio: '16:9'
          }
       });
       
       // Poll for completion
       while (!operation.done) {
          await new Promise(r => setTimeout(r, 4000)); // 4s poll interval
          console.log("Polling video status...");
          operation = await ai.operations.getVideosOperation({operation});
       }
       
       const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
       if (uri) {
          // Fetch the bytes using the API key
          const vidResp = await fetch(`${uri}&key=${process.env.API_KEY}`);
          const blob = await vidResp.blob();
          const localUrl = URL.createObjectURL(blob);
          setGeneratedVideoUrl(localUrl);
       } else {
         alert("Video generation completed but no URI returned.");
       }

    } catch (e) {
       console.error("Video Gen Error", e);
       alert("Failed to generate video. Please try a simpler prompt.");
    } finally {
       setIsGeneratingVideo(false);
       setVideoPromptInput('');
    }
  };

  useEffect(() => {
    return () => {
      cleanupAudio();
      stopScreenShare();
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-xl overflow-hidden text-white relative">
      
      {/* Hidden Video/Canvas for Screen Sharing Processing */}
      <video ref={screenVideoRef} className="hidden" muted playsInline />
      <canvas ref={screenCanvasRef} className="hidden" />

      {/* Main Stage */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}>
        </div>

        {/* Back Button */}
        {onBack && !isConnected && (
           <button 
             onClick={onBack}
             className="absolute top-6 left-6 z-50 p-3 bg-gray-800 hover:bg-gray-700 rounded-full text-white transition-colors"
             title="Go Back"
           >
             <ArrowLeft className="w-5 h-5" />
           </button>
        )}
        
        {/* History Button */}
        {!isConnected && (
           <button 
             onClick={() => setShowHistory(true)}
             className="absolute top-6 right-6 z-50 p-3 bg-gray-800 hover:bg-gray-700 rounded-full text-white transition-colors"
             title="Session History"
           >
             <History className="w-5 h-5" />
           </button>
        )}

        {/* AI Avatar */}
        <div className={`relative z-10 flex flex-col items-center transition-all duration-500 ${generatedVideoUrl || isScreenSharing ? 'scale-75 -translate-y-24' : ''}`}>
          <div className="relative w-48 h-48">
            <canvas 
              ref={avatarCanvasRef} 
              width={300} 
              height={300} 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            />
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-800 shadow-2xl mx-auto top-8 bg-gray-800">
               <img 
                 src="https://api.dicebear.com/7.x/bottts/svg?seed=H2-ALA-Tutor&backgroundColor=6366f1" 
                 alt="AI Tutor" 
                 className="w-full h-full object-cover"
               />
            </div>
          </div>
          
          <div className="mt-8 text-center min-h-[60px]">
             <h2 className="text-2xl font-bold tracking-tight">H²-ALA Live Tutor</h2>
             {!errorMessage ? (
               <p className={`text-sm mt-2 font-medium ${isConnected ? 'text-indigo-400' : 'text-gray-400'}`}>
                 {isGeneratingVideo 
                   ? 'Generating Visual Explanation (~1 min)...' 
                   : isScreenSharing
                      ? 'Analyzing your screen for code...'
                      : isConnected 
                        ? 'Listening...' 
                        : isConnecting 
                          ? 'Connecting to Gemini...' 
                          : 'Ready to start'}
               </p>
             ) : (
               <div className="mt-2 text-xs bg-red-500/10 border border-red-500/20 text-red-300 px-3 py-1 rounded-full inline-flex items-center space-x-1">
                 <AlertCircle className="w-3 h-3" />
                 <span>{errorMessage}</span>
               </div>
             )}
          </div>
        </div>

        {/* Generated Video Overlay */}
        {generatedVideoUrl && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-6 animate-slide-up z-30">
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center p-3 bg-gray-900 border-b border-gray-700">
                 <div className="flex items-center space-x-2 text-indigo-400">
                    <Clapperboard className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Visual Solution</span>
                 </div>
                 <button onClick={() => setGeneratedVideoUrl(null)} className="hover:text-white text-gray-400">
                   <X className="w-4 h-4" />
                 </button>
              </div>
              <video 
                src={generatedVideoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full aspect-video bg-black"
              />
            </div>
          </div>
        )}

        {/* Screen Share Preview - Picture-in-Picture */}
        {isScreenSharing && (
          <div className="absolute top-6 left-6 w-64 h-36 bg-gray-800 rounded-xl overflow-hidden border-2 border-green-500 shadow-lg z-20">
            <div className="absolute top-2 left-2 bg-green-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm z-10 flex items-center">
               <Monitor className="w-3 h-3 mr-1" /> SHARING SCREEN
            </div>
            {/* We can't easily mirror the stream to another video element without re-assigning srcObject, 
                so we use a clone or just trust the green indicator. 
                Actually, re-assigning screenStreamRef to this preview video is fine. */}
            <video 
              ref={(el) => { if (el && screenStreamRef.current) el.srcObject = screenStreamRef.current; }}
              autoPlay 
              muted 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* User Video Picture-in-Picture */}
        <div className="absolute bottom-6 right-6 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 shadow-lg transition-transform hover:scale-105 z-20">
           <video 
             ref={videoRef}
             autoPlay 
             muted 
             playsInline
             className={`w-full h-full object-cover mirror ${!isCameraOn ? 'hidden' : ''}`}
           />
           {!isCameraOn && (
             <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-800">
               <VideoOff className="w-8 h-8" />
             </div>
           )}
           <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm">
             YOU
           </div>
        </div>

        {/* Video Prompt Modal */}
        {showVideoPrompt && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-2">Generate Visual Explanation</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Describe the math concept you want to visualize. The AI will generate a short video clip.
                </p>
                <input 
                  type="text"
                  value={videoPromptInput}
                  onChange={(e) => setVideoPromptInput(e.target.value)}
                  placeholder="e.g. Pythagorean Theorem visual proof"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  autoFocus
                />
                <div className="flex justify-end space-x-3">
                   <button 
                     onClick={() => setShowVideoPrompt(false)}
                     className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleGenerateVideo}
                     disabled={!videoPromptInput.trim()}
                     className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isGeneratingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                     <span>Generate Video</span>
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Session History Modal */}
        {showHistory && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
             <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                   <h3 className="font-bold text-white flex items-center">
                     <History className="w-5 h-5 mr-2" />
                     Session Transcripts
                   </h3>
                   <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">
                      <X className="w-5 h-5" />
                   </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                   {pastSessions.length === 0 ? (
                      <p className="text-center text-gray-500 py-10">No recorded sessions yet.</p>
                   ) : (
                      pastSessions.map(session => (
                        <div key={session.id} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                           <div className="flex justify-between text-xs text-gray-400 mb-3 border-b border-gray-800 pb-2">
                              <span>{new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString()}</span>
                              <span>Duration: {Math.round((session.endTime - session.startTime)/1000)}s</span>
                           </div>
                           <div className="space-y-3">
                              {session.transcript.map((item, idx) => (
                                <div key={idx} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`max-w-[80%] rounded-lg p-2 text-sm ${item.role === 'user' ? 'bg-indigo-900/50 text-indigo-100' : 'bg-gray-800 text-gray-300'}`}>
                                      <p className="text-[10px] font-bold mb-0.5 opacity-50 uppercase">{item.role === 'user' ? 'Student' : 'AI Tutor'}</p>
                                      {item.text}
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      ))
                   )}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800 p-6 flex justify-center items-center space-x-6 border-t border-gray-700 z-20">
         
         {!isConnected && !isConnecting ? (
           <div className="flex flex-col items-center space-y-4 w-full">
              <div className="flex space-x-4">
                {/* Language Selector */}
                <div className="flex items-center space-x-2 bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                   <Globe className="w-4 h-4 text-indigo-400" />
                   <select 
                     value={selectedLanguage}
                     onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
                     className="bg-transparent text-gray-200 text-sm focus:outline-none cursor-pointer option-black"
                     style={{ colorScheme: 'dark' }}
                     title="Select Communication Language"
                   >
                     {Object.values(SupportedLanguage).map(lang => (
                       <option key={lang} value={lang} className="text-gray-900">{lang}</option>
                     ))}
                   </select>
                </div>

                {/* Voice Selector */}
                <div className="flex items-center space-x-2 bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                   <User className="w-4 h-4 text-indigo-400" />
                   <select 
                     value={selectedVoice}
                     onChange={(e) => setSelectedVoice(e.target.value as AIVoice)}
                     className="bg-transparent text-gray-200 text-sm focus:outline-none cursor-pointer option-black"
                     style={{ colorScheme: 'dark' }}
                     title="Select AI Voice Assistant"
                   >
                     {Object.values(AIVoice).map(voice => (
                       <option key={voice} value={voice} className="text-gray-900">{voice}</option>
                     ))}
                   </select>
                </div>
              </div>

              <button 
                onClick={startSession}
                className="flex items-center space-x-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                <Volume2 className="w-6 h-6" />
                <span>Start Live Session</span>
              </button>
           </div>
         ) : isConnecting ? (
           <button disabled className="flex items-center space-x-3 bg-gray-700 text-gray-400 px-8 py-4 rounded-full font-semibold text-lg cursor-not-allowed">
             <Loader2 className="w-6 h-6 animate-spin" />
             <span>Connecting...</span>
           </button>
         ) : (
           <>
             <button 
               onClick={() => setIsMicOn(!isMicOn)}
               className={`p-4 rounded-full transition-all ${isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500/20 text-red-500'}`}
               title={isMicOn ? "Mute Mic" : "Unmute Mic"}
             >
               {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
             </button>
             
             <button 
               onClick={handleDisconnect}
               className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium flex items-center space-x-2 transition-colors shadow-lg"
             >
               <PhoneOff className="w-5 h-5" />
               <span>End Call</span>
             </button>
             
             <button 
               onClick={() => setIsCameraOn(!isCameraOn)}
               className={`p-4 rounded-full transition-all ${isCameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500/20 text-red-500'}`}
               title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
             >
               {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
             </button>

             {/* Vertical Divider */}
             <div className="h-8 w-px bg-gray-700 mx-2"></div>

             {/* Screen Share Button */}
             <button
               onClick={isScreenSharing ? stopScreenShare : handleScreenShare}
               className={`p-4 rounded-full transition-all ${isScreenSharing ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/25 shadow-lg' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
               title={isScreenSharing ? "Stop Sharing Screen" : "Share Code/Screen"}
             >
               {isScreenSharing ? <StopCircle className="w-6 h-6 animate-pulse" /> : <Monitor className="w-6 h-6" />}
             </button>

             {/* Visual Aid Button */}
             <button
               onClick={() => setShowVideoPrompt(true)}
               disabled={isGeneratingVideo}
               className={`p-4 rounded-full transition-all ${isGeneratingVideo ? 'bg-indigo-900/50 cursor-not-allowed text-indigo-300' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
               title="Generate Visual Explanation"
             >
               {isGeneratingVideo ? <Loader2 className="w-6 h-6 animate-spin" /> : <Clapperboard className="w-6 h-6" />}
             </button>
           </>
         )}
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
        @keyframes slide-up {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};