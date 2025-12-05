

import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Copy, FileText, Check, AlertCircle } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';

export const AudioTranscriber: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setError(null);
      setTranscription(null);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = handleStop;

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Most browsers support webm
    setIsTranscribing(true);
    
    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          // Send to Gemini
          const text = await transcribeAudio(base64String, 'audio/webm');
          setTranscription(text);
        } catch (err) {
          setError("Failed to transcribe audio. Please try again.");
        } finally {
          setIsTranscribing(false);
        }
      };
    } catch (e) {
      setError("Error processing audio file.");
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (transcription) {
      navigator.clipboard.writeText(transcription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <FileText className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-400" />
          AI Audio Transcriber
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Record voice notes and get instant text transcriptions powered by Gemini 2.5.</p>
      </div>

      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        
        {/* Recorder Circle */}
        <div className="relative mb-12">
           {isRecording && (
             <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"></div>
           )}
           <button
             onClick={isRecording ? stopRecording : startRecording}
             disabled={isTranscribing}
             className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-105 ${
               isRecording 
                 ? 'bg-red-500 hover:bg-red-600 text-white' 
                 : isTranscribing
                   ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                   : 'bg-indigo-600 hover:bg-indigo-700 text-white'
             }`}
           >
             {isTranscribing ? (
               <Loader2 className="w-12 h-12 animate-spin text-gray-500 dark:text-gray-400" />
             ) : isRecording ? (
               <Square className="w-10 h-10 fill-current" />
             ) : (
               <Mic className="w-12 h-12" />
             )}
           </button>
           
           {isRecording && (
             <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-lg font-mono font-bold text-red-500">
                {formatTime(recordingTime)}
             </div>
           )}
        </div>

        {isTranscribing && (
           <div className="text-center mb-8 animate-pulse">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Processing Audio...</h3>
              <p className="text-gray-500 dark:text-gray-400">Gemini is listening to your recording.</p>
           </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center text-red-600 dark:text-red-400 w-full max-w-2xl">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Transcription Result */}
        {transcription && (
          <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-200">Transcription Result</span>
              <button 
                onClick={handleCopy}
                className="flex items-center space-x-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-lg">
                {transcription}
              </p>
            </div>
          </div>
        )}

        {!isRecording && !transcription && !isTranscribing && (
          <div className="text-center text-gray-400 dark:text-gray-500 mt-4 max-w-md">
            <p>Tap the microphone to start recording. We'll convert your speech to text instantly.</p>
          </div>
        )}
      </div>
    </div>
  );
};