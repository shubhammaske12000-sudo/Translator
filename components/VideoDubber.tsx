import React, { useState, useRef, useEffect } from 'react';
import { DUBBING_LANGUAGES, MAX_FILE_SIZE_MB, MAX_VIDEO_DURATION_SEC } from '../constants';
import { LanguageOption } from '../types';
import { translateVideo, generateSpeech } from '../services/geminiService';
import { blobToBase64, decodeAudioData } from '../services/audioUtils';

interface VideoDubberProps {
  onError: (msg: string) => void;
}

const VideoDubber: React.FC<VideoDubberProps> = ({ onError }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<LanguageOption>(DUBBING_LANGUAGES[0]); // Default Hindi
  const [isProcessing, setIsProcessing] = useState(false);
  const [dubbedAudioBuffer, setDubbedAudioBuffer] = useState<AudioBuffer | null>(null);
  const [progressStep, setProgressStep] = useState<string>('');
  
  // Refs for media elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize Audio Context
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setDubbedAudioBuffer(null);
    setProgressStep('');
    if (videoUrl) URL.revokeObjectURL(videoUrl);

    // Basic Size Check
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      onError(`File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const url = URL.createObjectURL(file);
    
    // Duration Check via temporary video element
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      window.URL.revokeObjectURL(tempVideo.src);
      if (tempVideo.duration > MAX_VIDEO_DURATION_SEC) {
        onError(`Video is too long (${Math.round(tempVideo.duration)}s). Max allowed is 5 minutes.`);
        setVideoFile(null);
        setVideoUrl(null);
      } else {
        setVideoFile(file);
        setVideoUrl(url);
      }
    };
    tempVideo.src = url;
  };

  const handleProcessVideo = async () => {
    if (!videoFile || !videoUrl) return;
    
    setIsProcessing(true);
    initAudioContext();

    try {
      // 1. Convert video to base64
      setProgressStep('Uploading & Analyzing Video...');
      const base64Video = await blobToBase64(videoFile);

      // 2. Translate text from video
      setProgressStep(`Translating audio to ${targetLang.name}...`);
      const translatedText = await translateVideo(base64Video, videoFile.type, targetLang.name);
      
      if (!translatedText) throw new Error("Could not extract or translate text from video.");

      // 3. Generate Speech
      setProgressStep('Generating Dubbed Audio...');
      const audioBase64 = await generateSpeech(translatedText);
      
      // 4. Decode Audio
      setProgressStep('Finalizing...');
      if (audioContextRef.current) {
        const buffer = await decodeAudioData(audioBase64, audioContextRef.current);
        setDubbedAudioBuffer(buffer);
      }

    } catch (err: any) {
      console.error(err);
      onError(err.message || "Failed to dub video.");
    } finally {
      setIsProcessing(false);
      setProgressStep('');
    }
  };

  // Sync Audio with Video Play/Pause/Seek
  const handleVideoPlay = () => {
    if (!dubbedAudioBuffer || !audioContextRef.current || !videoRef.current) return;

    // Create source
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e){}
    }
    
    audioSourceRef.current = audioContextRef.current.createBufferSource();
    audioSourceRef.current.buffer = dubbedAudioBuffer;
    audioSourceRef.current.connect(audioContextRef.current.destination);

    // Sync start time based on video current time
    const offset = videoRef.current.currentTime;
    audioSourceRef.current.start(0, offset);
  };

  const handleVideoPause = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e){}
      audioSourceRef.current = null;
    }
  };

  const handleVideoSeek = () => {
    // If playing, restart audio from new time
    if (videoRef.current && !videoRef.current.paused) {
      handleVideoPlay();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-800/60 backdrop-blur-md border border-slate-700 rounded-3xl p-6 md:p-8 flex flex-col items-center">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">AI Video Dubbing</h2>
        <p className="text-slate-400 text-sm">Upload a video (max 5 min) and dub it into Hindi or English.</p>
      </div>

      {/* Upload Section */}
      {!videoUrl && !isProcessing && (
        <label className="w-full flex flex-col items-center px-4 py-12 bg-slate-700/30 rounded-2xl border-2 border-dashed border-slate-600 hover:border-indigo-500 cursor-pointer transition-colors group">
          <svg className="w-12 h-12 text-slate-500 group-hover:text-indigo-400 mb-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-slate-300 font-medium">Click to upload video</span>
          <span className="text-slate-500 text-xs mt-2">MP4, WebM (Max 50MB, 5 min)</span>
          <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleFileChange} />
        </label>
      )}

      {/* Video Preview & Controls */}
      {videoUrl && (
        <div className="w-full flex flex-col gap-6">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-2xl">
            <video 
              ref={videoRef}
              src={videoUrl} 
              className="w-full h-full object-contain"
              controls={!isProcessing}
              muted={!!dubbedAudioBuffer} // Mute original audio if dubbing is ready
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onSeeking={handleVideoPause}
              onSeeked={handleVideoSeek}
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-indigo-300 font-medium animate-pulse">{progressStep}</p>
              </div>
            )}
          </div>

          {!isProcessing && !dubbedAudioBuffer && (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-700/30 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm font-medium">Dub to:</span>
                <div className="flex bg-slate-800 rounded-lg p-1">
                  {DUBBING_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setTargetLang(lang)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        targetLang.code === lang.code 
                        ? 'bg-indigo-500 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                 <button 
                  onClick={() => {
                     setVideoUrl(null);
                     setVideoFile(null);
                     setDubbedAudioBuffer(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 text-slate-400 hover:text-white text-sm font-medium"
                >
                  Change Video
                </button>
                <button 
                  onClick={handleProcessVideo}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-105"
                >
                  Generate Dub
                </button>
              </div>
            </div>
          )}

          {dubbedAudioBuffer && (
             <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
               <div className="bg-green-500 text-white p-2 rounded-full">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
               </div>
               <div>
                 <p className="text-green-300 font-medium text-sm">Dubbing Complete!</p>
                 <p className="text-slate-400 text-xs">Play the video above to hear the {targetLang.name} translation.</p>
               </div>
               <button 
                  onClick={() => {
                     setDubbedAudioBuffer(null);
                  }}
                  className="ml-auto text-xs text-slate-400 hover:text-white underline"
                >
                  Reset
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoDubber;