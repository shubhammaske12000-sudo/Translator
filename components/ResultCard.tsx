import React from 'react';

interface ResultCardProps {
  type: 'source' | 'target';
  title: string;
  text?: string;
  placeholder?: string;
  detectedLanguage?: string;
  isRecording?: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
  onPlay?: () => void;
  headerAction?: React.ReactNode;
}

const WaveAnimation = () => (
  <div className="wave-animation text-indigo-400 h-4 flex items-center gap-1">
    <div className="wave-bar bg-indigo-400 w-1 h-3 rounded-full animate-[wave_1s_ease-in-out_infinite]"></div>
    <div className="wave-bar bg-indigo-400 w-1 h-4 rounded-full animate-[wave_1s_ease-in-out_0.1s_infinite]"></div>
    <div className="wave-bar bg-indigo-400 w-1 h-2 rounded-full animate-[wave_1s_ease-in-out_0.2s_infinite]"></div>
    <div className="wave-bar bg-indigo-400 w-1 h-4 rounded-full animate-[wave_1s_ease-in-out_0.1s_infinite]"></div>
    <div className="wave-bar bg-indigo-400 w-1 h-3 rounded-full animate-[wave_1s_ease-in-out_0s_infinite]"></div>
  </div>
);

const ResultCard: React.FC<ResultCardProps> = ({ 
  type, 
  title, 
  text, 
  placeholder,
  detectedLanguage, 
  isRecording, 
  isProcessing,
  isSpeaking, 
  onPlay,
  headerAction
}) => {
  return (
    <div className={`
      flex-1 flex flex-col bg-slate-800/60 backdrop-blur-md border border-slate-700 rounded-3xl p-6 md:p-8
      transition-all duration-300 group
      ${isRecording && type === 'source' ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'hover:border-slate-600'}
      ${isSpeaking && type === 'target' ? 'border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.1)]' : ''}
    `}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 min-h-[40px]">
        <div className="flex items-center gap-3">
          {type === 'source' ? (
             <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
                {detectedLanguage ? (
                   <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-indigo-500/20">
                     {detectedLanguage}
                   </span>
                ) : (
                  <span className="bg-slate-700 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    AUTO
                  </span>
                )}
             </div>
          ) : (
             <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">TO</span>
               {headerAction}
             </div>
          )}
        </div>

        {/* Status Indicators */}
        <div>
          {type === 'source' && isRecording && (
             <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium bg-indigo-400/10 px-3 py-1.5 rounded-full">
               <span>Listening</span>
               <WaveAnimation />
             </div>
          )}
           {type === 'source' && isProcessing && (
             <div className="flex items-center gap-2 text-slate-300 text-xs font-medium animate-pulse">
               <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Translating...
             </div>
          )}
          
          {type === 'target' && text && onPlay && (
            <button 
              onClick={onPlay}
              disabled={isSpeaking}
              className={`p-2 rounded-full transition-all duration-200 
                ${isSpeaking 
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' 
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              title="Play Audio"
            >
              {isSpeaking ? (
                 <WaveAnimation />
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow flex flex-col justify-center">
        <p className={`
          text-xl md:text-2xl leading-relaxed font-light break-words
          ${text ? 'text-slate-100' : 'text-slate-600 italic'}
        `}>
          {text || placeholder}
        </p>
      </div>
    </div>
  );
};

export default ResultCard;