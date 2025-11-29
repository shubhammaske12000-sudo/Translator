import React, { useState, useRef } from 'react';
import { SUPPORTED_LANGUAGES } from './constants';
import { AppState, LanguageOption, TranslationResult } from './types';
import { translateAudio, generateSpeech } from './services/geminiService';
import { blobToBase64, decodeAudioData } from './services/audioUtils';

import MicrophoneButton from './components/MicrophoneButton';
import LanguageDropdown from './components/LanguageDropdown';
import ResultCard from './components/ResultCard';
import VideoDubber from './components/VideoDubber';

type Mode = 'VOICE' | 'VIDEO';

const App: React.FC = () => {
  // State
  const [mode, setMode] = useState<Mode>('VOICE');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [targetLanguage, setTargetLanguage] = useState<LanguageOption>(SUPPORTED_LANGUAGES[0]); 
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context on user interaction
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000 // Match Gemini TTS
      });
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const startRecording = async () => {
    setError(null);
    initAudioContext();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setAppState(AppState.RECORDING);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please allow permissions.");
      setAppState(AppState.IDLE);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setAppState(AppState.PROCESSING);
    
    try {
      const base64Audio = await blobToBase64(audioBlob);
      
      // 1. Translate
      const translation = await translateAudio(base64Audio, targetLanguage.name);
      setResult(translation);

      // 2. TTS
      if (translation.translatedText) {
        setAppState(AppState.SPEAKING);
        const ttsAudioBase64 = await generateSpeech(translation.translatedText);
        await playAudio(ttsAudioBase64);
      }
      
      setAppState(AppState.IDLE);

    } catch (err) {
      console.error("Processing failed:", err);
      setError("Failed to translate or generate speech. Please try again.");
      setAppState(AppState.IDLE);
    }
  };

  const playAudio = async (base64Data: string) => {
    if (!audioContextRef.current) return;

    try {
      const audioBuffer = await decodeAudioData(base64Data, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      
      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
      });
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  const handleReplay = async () => {
    if (result?.translatedText && appState === AppState.IDLE) {
       setAppState(AppState.SPEAKING);
       try {
         const ttsAudioBase64 = await generateSpeech(result.translatedText);
         await playAudio(ttsAudioBase64);
       } catch (err) {
         console.error("Replay failed", err);
       } finally {
         setAppState(AppState.IDLE);
       }
    }
  };

  const handleMicClick = () => {
    if (appState === AppState.IDLE) {
      startRecording();
    } else if (appState === AppState.RECORDING) {
      stopRecording();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-900 text-slate-100 font-sans p-4 md:p-8 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      <header className="mb-8 text-center z-10 w-full max-w-lg">
        <div className="inline-flex items-center justify-center p-2 mb-4 bg-slate-800/50 rounded-full backdrop-blur-sm border border-slate-700/50">
           <span className="w-2 h-2 bg-green-400 rounded-full mx-2 animate-pulse"></span>
           <span className="text-xs font-medium text-slate-300 pr-2">Gemini 2.5 Flash</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 mb-2">
          BhashaSetu
        </h1>
        <p className="text-slate-400 text-sm mb-6">Universal AI Voice Translator</p>

        {/* Mode Switcher */}
        <div className="bg-slate-800/80 p-1 rounded-xl flex shadow-lg">
          <button 
            onClick={() => setMode('VOICE')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'VOICE' 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Voice
          </button>
          <button 
            onClick={() => setMode('VIDEO')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'VIDEO' 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Video Dubbing
          </button>
        </div>
      </header>

      {mode === 'VOICE' ? (
        <main className="w-full max-w-5xl relative flex flex-col md:flex-row gap-4 md:gap-8 items-stretch z-10 flex-grow max-h-[600px]">
          
          {/* Left: Input / Auto Detect */}
          <ResultCard 
            type="source"
            title="Detected Language"
            detectedLanguage={result?.detectedLanguage}
            text={result?.sourceText}
            isRecording={appState === AppState.RECORDING}
            isProcessing={appState === AppState.PROCESSING}
            placeholder="Tap microphone and speak..."
          />

          {/* Center: Controls (Desktop: Absolute Centered) */}
          <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-20 flex justify-center py-2 md:py-0">
            <MicrophoneButton 
              isRecording={appState === AppState.RECORDING} 
              isProcessing={appState === AppState.PROCESSING} 
              onClick={handleMicClick} 
            />
          </div>

          {/* Right: Output / Target */}
          <ResultCard 
            type="target"
            title="Translate To"
            text={result?.translatedText}
            isSpeaking={appState === AppState.SPEAKING}
            onPlay={handleReplay}
            placeholder="Translation will appear here..."
            headerAction={
              <LanguageDropdown 
                selectedLanguage={targetLanguage}
                onChange={setTargetLanguage}
                disabled={appState !== AppState.IDLE}
              />
            }
          />
        </main>
      ) : (
        <main className="w-full z-10">
          <VideoDubber onError={setError} />
        </main>
      )}

       {/* Error Message */}
       {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-lg backdrop-blur-md animate-bounce z-50 text-center max-w-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-3 font-bold hover:text-red-200">&times;</button>
          </div>
        )}
      
      <footer className="mt-8 text-slate-600 text-xs text-center">
        &copy; {new Date().getFullYear()} BhashaSetu • Powered by Google Gemini
      </footer>
    </div>
  );
};

export default App;